"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.testConnection = testConnection;
const promise_1 = __importDefault(require("mysql2/promise"));
const env_1 = require("./env");
exports.pool = promise_1.default.createPool({
    host: env_1.env.db.host,
    port: env_1.env.db.port,
    database: env_1.env.db.name,
    user: env_1.env.db.user,
    password: env_1.env.db.password,
    waitForConnections: true,
    connectionLimit: 10,
    timezone: '+00:00',
});
async function testConnection() {
    const conn = await exports.pool.getConnection();
    console.log('✅ MySQL connected');
    conn.release();
}
//# sourceMappingURL=database.js.map