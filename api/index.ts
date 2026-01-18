export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Get the path
  const path = req.url || '/';

  // Health check route
  if (path === '/health' || path === '/api/health') {
    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'SecureVault API',
      environment: process.env.NODE_ENV || 'production'
    });
  }

  // Root route - API info
  if (path === '/' || path === '/api' || path === '/api/') {
    return res.status(200).json({
      message: 'SecureVault CCTV API',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        health: '/health',
        api: '/api',
        cameras: '/api/cameras (coming soon)',
        recordings: '/api/recordings (coming soon)',
      },
      timestamp: new Date().toISOString()
    });
  }

  // 404 for other routes
  return res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${path} not found`,
    timestamp: new Date().toISOString()
  });
}