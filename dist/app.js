"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const env_1 = require("./config/env");
const database_1 = require("./config/database");
const websocket_service_1 = require("./services/websocket.service");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const team_routes_1 = __importDefault(require("./routes/team.routes"));
const battle_routes_1 = __importDefault(require("./routes/battle.routes"));
const community_routes_1 = __importDefault(require("./routes/community.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const public_routes_1 = __importDefault(require("./routes/public.routes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: env_1.env.corsOrigin, credentials: true }));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/api/auth', auth_routes_1.default);
app.use('/api/teams', team_routes_1.default);
app.use('/api/battles', battle_routes_1.default);
app.use('/api/community', community_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/public', public_routes_1.default);
app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));
async function bootstrap() {
    await (0, database_1.testConnection)();
    const server = http_1.default.createServer(app);
    (0, websocket_service_1.createWebSocketServer)(server);
    server.listen(env_1.env.port, () => {
        console.log('PoryBot API running on http://localhost:' + env_1.env.port);
        console.log('WebSocket listening on ws://localhost:' + env_1.env.port + '/ws');
        console.log('phpMyAdmin on http://localhost:8080');
    });
}
bootstrap().catch(err => { console.error('Failed to start:', err); process.exit(1); });
//# sourceMappingURL=app.js.map