export default async function handler(req: any, res: any) {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Get path
    const url = req.url || '/';
    
    console.log('Incoming request:', { method: req.method, url });

    // Health check
    if (url.includes('health')) {
      return res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'SecureVault API',
      });
    }

    // Default - API info (for all other paths)
    return res.status(200).json({
      message: 'SecureVault CCTV API',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        health: '/health',
        api: '/api',
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Handler error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}