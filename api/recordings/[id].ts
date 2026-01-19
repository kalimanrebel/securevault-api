import { createClient } from '@supabase/supabase-js';
import { S3Client, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const s3Client = new S3Client({
  endpoint: process.env.WASABI_ENDPOINT,
  region: process.env.WASABI_REGION || 'ap-southeast-2',
  credentials: {
    accessKeyId: process.env.WASABI_ACCESS_KEY!,
    secretAccessKey: process.env.WASABI_SECRET_KEY!,
  },
});

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
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

    // Get recording ID from URL
    const recordingId = req.query.id || req.url?.split('/').pop();

    // GET - Get recording with signed download URL
    if (req.method === 'GET') {
      const { data: recording, error } = await supabase
        .from('recordings')
        .select('*, cameras(name, location)')
        .eq('id', recordingId)
        .eq('user_id', user.id)
        .single();

      if (error || !recording) {
        return res.status(404).json({ error: 'Recording not found' });
      }

      // Generate signed download URL (valid for 1 hour)
      const command = new GetObjectCommand({
        Bucket: process.env.WASABI_BUCKET,
        Key: recording.file_path,
      });

      const downloadUrl = await getSignedUrl(s3Client, command, { 
        expiresIn: 3600 // 1 hour
      });

      return res.status(200).json({ 
        recording,
        download_url: downloadUrl
      });
    }

    // DELETE - Delete recording
    if (req.method === 'DELETE') {
      // Get recording first
      const { data: recording, error: fetchError } = await supabase
        .from('recordings')
        .select('*')
        .eq('id', recordingId)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !recording) {
        return res.status(404).json({ error: 'Recording not found' });
      }

      // Delete from Wasabi
      try {
        await s3Client.send(new DeleteObjectCommand({
          Bucket: process.env.WASABI_BUCKET,
          Key: recording.file_path,
        }));
      } catch (s3Error) {
        console.error('Wasabi delete error:', s3Error);
        // Continue anyway - file might not exist
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from('recordings')
        .delete()
        .eq('id', recordingId)
        .eq('user_id', user.id);

      if (deleteError) {
        return res.status(500).json({ error: deleteError.message });
      }

      return res.status(200).json({ 
        message: 'Recording deleted successfully' 
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}