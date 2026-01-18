import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Get user from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // GET - List all cameras for this user
    if (req.method === 'GET') {
      const { data: cameras, error } = await supabase
        .from('cameras')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ cameras });
    }

    // POST - Create new camera
    if (req.method === 'POST') {
      const { name, location, rtsp_url } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Camera name is required' });
      }

      // Generate stream path
      const streamPath = `${user.id}/${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

      const { data: camera, error } = await supabase
        .from('cameras')
        .insert({
          user_id: user.id,
          name,
          location: location || null,
          rtsp_url: rtsp_url || null,
          stream_path: streamPath,
          status: 'offline'
        })
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      // Generate streaming URLs
      const streamingUrls = {
        rtsp: `rtsp://camera:SecureVault2026!@54.206.29.65:8554/${streamPath}`,
        webrtc: `http://54.206.29.65:8889/${streamPath}`,
        hls: `http://54.206.29.65:8888/${streamPath}`
      };

      return res.status(201).json({ 
        camera,
        streaming_urls: streamingUrls
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}