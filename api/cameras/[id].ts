import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Auth
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get camera ID from URL
    const cameraId = req.query.id || req.url?.split('/').pop();

    // GET - Get camera details
    if (req.method === 'GET') {
      const { data: camera, error } = await supabase
        .from('cameras')
        .select('*')
        .eq('id', cameraId)
        .eq('user_id', user.id)
        .single();

      if (error || !camera) {
        return res.status(404).json({ error: 'Camera not found' });
      }

      // Generate streaming URLs
      const streamingUrls = {
        rtsp: `rtsp://camera:SecureVault2026!@54.206.29.65:8554/${camera.stream_path}`,
        webrtc: `http://54.206.29.65:8889/${camera.stream_path}`,
        hls: `http://54.206.29.65:8888/${camera.stream_path}`
      };

      return res.status(200).json({ 
        camera,
        streaming_urls: streamingUrls
      });
    }

    // PUT - Update camera
    if (req.method === 'PUT') {
      const { name, location, rtsp_url, status } = req.body;

      const updateData: any = {};
      if (name) updateData.name = name;
      if (location !== undefined) updateData.location = location;
      if (rtsp_url !== undefined) updateData.rtsp_url = rtsp_url;
      if (status) updateData.status = status;

      const { data: camera, error } = await supabase
        .from('cameras')
        .update(updateData)
        .eq('id', cameraId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ camera });
    }

    // DELETE - Delete camera
    if (req.method === 'DELETE') {
      const { error } = await supabase
        .from('cameras')
        .delete()
        .eq('id', cameraId)
        .eq('user_id', user.id);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ message: 'Camera deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}