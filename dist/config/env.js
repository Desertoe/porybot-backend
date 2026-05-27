"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.env = {
    port: parseInt(process.env.PORT || '3000'),
    nodeEnv: process.env.NODE_ENV || 'development',
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        name: process.env.DB_NAME || 'porybot',
        user: process.env.DB_USER || 'porybot_user',
        password: process.env.DB_PASSWORD || '',
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'changeme',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:4200',
};
//# sourceMappingURL=env.js.map