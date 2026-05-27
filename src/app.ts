import express from 'express';
import cors from 'cors';
import http from 'http';
import { env } from './config/env';
import { testConnection } from './config/database';
import { createWebSocketServer } from './services/websocket.service';
import authRoutes from './routes/auth.routes';
import teamRoutes from './routes/team.routes';
import battleRoutes from './routes/battle.routes';
import communityRoutes from './routes/community.routes';
import adminRoutes from './routes/admin.routes';
import publicRoutes from './routes/public.routes';

const app = express();
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/battles', battleRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);
app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));

async function bootstrap(): Promise<void> {
  await testConnection();
  const server = http.createServer(app);
  createWebSocketServer(server);
  server.listen(env.port, () => {
    console.log('PoryBot API running on http://localhost:' + env.port);
    console.log('WebSocket listening on ws://localhost:' + env.port + '/ws');
    console.log('phpMyAdmin on http://localhost:8080');
  });
}

bootstrap().catch(err => { console.error('Failed to start:', err); process.exit(1); });