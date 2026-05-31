"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerBotSocket = registerBotSocket;
exports.sendToBotSocket = sendToBotSocket;
exports.isBotConnected = isBotConnected;
exports.createWebSocketServer = createWebSocketServer;
exports.notifyUser = notifyUser;
exports.notifyBattleFinished = notifyBattleFinished;
exports.notifyBattleStarted = notifyBattleStarted;
exports.registerPendingBattle = registerPendingBattle;
exports.getUserByNick = getUserByNick;
exports.clearPendingBattle = clearPendingBattle;
const ws_1 = require("ws");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const clients = new Map();
let botSocket = null;
const pendingBotMessages = [];
function registerBotSocket(ws) {
    botSocket = ws;
    console.log('Bot conectado al WebSocket');
    // Enviar mensajes pendientes acumulados mientras el bot estaba desconectado
    while (pendingBotMessages.length > 0) {
        const msg = pendingBotMessages.shift();
        if (msg) {
            ws.send(JSON.stringify(msg));
            console.log('[Bot] Mensaje pendiente enviado:', JSON.stringify(msg).slice(0, 80));
        }
    }
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });
    ws.on('close', () => { botSocket = null; console.log('Bot desconectado'); });
    ws.on('error', console.error);
}
function sendToBotSocket(data) {
    if (botSocket && botSocket.readyState === ws_1.WebSocket.OPEN) {
        botSocket.send(JSON.stringify(data));
        return true;
    }
    // Bot no conectado — encolar el mensaje para enviarlo cuando reconecte
    pendingBotMessages.push(data);
    console.log('[Bot] No conectado — mensaje encolado:', JSON.stringify(data).slice(0, 80));
    return false;
}
function isBotConnected() {
    return botSocket !== null && botSocket.readyState === ws_1.WebSocket.OPEN;
}
function createWebSocketServer(server) {
    const wss = new ws_1.WebSocketServer({ server, path: '/ws' });
    wss.on('connection', (ws, req) => {
        const url = new URL(req.url || '', 'http://localhost');
        const token = url.searchParams.get('token');
        const isBotKey = url.searchParams.get('bot_key');
        if (isBotKey === env_1.env.jwt.secret) {
            registerBotSocket(ws);
            return;
        }
        if (!token) {
            ws.close(1008, 'No token');
            return;
        }
        try {
            const payload = jsonwebtoken_1.default.verify(token, env_1.env.jwt.secret);
            ws.userId = payload.userId;
            clients.set(payload.userId, ws);
            console.log('WS connected: ' + payload.userId);
        }
        catch {
            ws.close(1008, 'Invalid token');
            return;
        }
        ws.on('close', () => { if (ws.userId)
            clients.delete(ws.userId); });
        ws.on('error', console.error);
    });
    const interval = setInterval(() => {
        wss.clients.forEach((ws) => {
            if (ws.isAlive === false) {
                ws.terminate();
                return;
            }
            ws.isAlive = false;
            ws.ping();
        });
    }, 25000);
    wss.on('close', () => clearInterval(interval));
    return wss;
}
function notifyUser(userId, event, data) {
    const client = clients.get(userId);
    if (client && client.readyState === ws_1.WebSocket.OPEN)
        client.send(JSON.stringify({ event, data }));
}
function notifyBattleFinished(userId, battleId, result) {
    notifyUser(userId, 'battle:finished', { battleId, result });
}
function notifyBattleStarted(userId, battleId) {
    notifyUser(userId, 'battle:started', { battleId });
}
const pendingBattles = new Map();
function registerPendingBattle(userId, nick) {
    pendingBattles.set(nick.toLowerCase(), userId);
}
function getUserByNick(nick) {
    return pendingBattles.get(nick.toLowerCase());
}
function clearPendingBattle(nick) {
    pendingBattles.delete(nick.toLowerCase());
}
//# sourceMappingURL=websocket.service.js.map