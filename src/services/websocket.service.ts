import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayload } from '../types';

interface AuthenticatedSocket extends WebSocket { userId?: string; }
const clients = new Map<string, AuthenticatedSocket>();

let botSocket: WebSocket | null = null;

export function registerBotSocket(ws: WebSocket): void {
  botSocket = ws;
  console.log('Bot conectado al WebSocket');
  ws.on('close', () => { botSocket = null; console.log('Bot desconectado'); });
  ws.on('error', console.error);
}

export function sendToBotSocket(data: object): boolean {
  if (botSocket && botSocket.readyState === WebSocket.OPEN) {
    botSocket.send(JSON.stringify(data));
    return true;
  }
  return false;
}

export function isBotConnected(): boolean {
  return botSocket !== null && botSocket.readyState === WebSocket.OPEN;
}

export function createWebSocketServer(server: any): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/ws' });
  wss.on('connection', (ws: AuthenticatedSocket, req: IncomingMessage) => {
    const url = new URL(req.url || '', 'http://localhost');
    const token = url.searchParams.get('token');
    const isBotKey = url.searchParams.get('bot_key');

    if (isBotKey === env.jwt.secret) {
      registerBotSocket(ws);
      (ws as any).isAlive = true;
      ws.on('pong', () => { (ws as any).isAlive = true; });
      return;
    }

    if (!token) { ws.close(1008, 'No token'); return; }
    try {
      const payload = jwt.verify(token, env.jwt.secret) as JwtPayload;
      ws.userId = payload.userId;
      clients.set(payload.userId, ws);
      console.log('WS connected: ' + payload.userId);
    } catch { ws.close(1008, 'Invalid token'); return; }
    ws.on('close', () => { if (ws.userId) clients.delete(ws.userId); });
    ws.on('error', console.error);
  });

  const interval = setInterval(() => {
  wss.clients.forEach((ws: any) => {
    if (ws.isAlive === false) { ws.terminate(); return; }
    ws.isAlive = false;
    ws.ping();
  });
}, 25000);

wss.on('close', () => clearInterval(interval));

  return wss;
}

export function notifyUser(userId: string, event: string, data: object): void {
  const client = clients.get(userId);
  if (client && client.readyState === WebSocket.OPEN) client.send(JSON.stringify({ event, data }));
}

export function notifyBattleFinished(userId: string, battleId: string, result: 'win' | 'loss'): void {
  notifyUser(userId, 'battle:finished', { battleId, result });
}

export function notifyBattleStarted(userId: string, battleId: string): void {
  notifyUser(userId, 'battle:started', { battleId });
}

const pendingBattles = new Map<string, string>();

export function registerPendingBattle(userId: string, nick: string): void {
  pendingBattles.set(nick.toLowerCase(), userId);
}

export function getUserByNick(nick: string): string | undefined {
  return pendingBattles.get(nick.toLowerCase());
}

export function clearPendingBattle(nick: string): void {
  pendingBattles.delete(nick.toLowerCase());
}