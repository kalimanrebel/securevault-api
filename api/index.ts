import Fastify from 'fastify';
import cors from '@fastify/cors';

const fastify = Fastify({
  logger: false,
  trustProxy: true,
});

await fastify.register(cors, {
  origin: true,
  credentials: true,
});

// Root route
fastify.get('/', async () => {
  return { 
    message: 'SecureVault CCTV API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      api: '/api',
    }
  };
});

// Health check
fastify.get('/health', async () => {
  return { 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'SecureVault API'
  };
});

export default async function handler(req: any, res: any) {
  await fastify.ready();
  fastify.server.emit('request', req, res);
}