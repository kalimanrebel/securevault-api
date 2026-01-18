import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';

dotenv.config();

export async function createServer() {
  const fastify = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'development' ? 'info' : 'warn',
    },
    trustProxy: true,
  });

  await fastify.register(cors, {
    origin: true,
    credentials: true,
  });

  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'change-this-secret',
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
        auth: '/api/auth/*',
        cameras: '/api/cameras/*',
        recordings: '/api/recordings/*',
      },
      docs: 'https://github.com/kalimanrebel/securevault-api'
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

  // API info
  fastify.get('/api', async () => {
    return { 
      message: 'SecureVault CCTV API',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        auth: '/api/auth/*',
        cameras: '/api/cameras/*',
        recordings: '/api/recordings/*',
      }
    };
  });

  return fastify;
}

// Start server for local development
if (process.env.NODE_ENV !== 'production') {
  const fastify = await createServer();
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('🚀 SecureVault API running at http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}