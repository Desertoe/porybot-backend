"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.adminMiddleware = adminMiddleware;
exports.premiumMiddleware = premiumMiddleware;
exports.optionalAuthMiddleware = optionalAuthMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: 'No token provided' });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.jwt.secret);
        req.user = payload;
        next();
    }
    catch {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
}
function adminMiddleware(req, res, next) {
    if (req.user?.role !== 'admin') {
        res.status(403).json({ message: 'Admin access required' });
        return;
    }
    next();
}
function premiumMiddleware(req, res, next) {
    if (req.user?.role !== 'premium' && req.user?.role !== 'admin') {
        res.status(403).json({ message: 'Premium access required' });
        return;
    }
    next();
}
function optionalAuthMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        next();
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.jwt.secret);
        req.user = payload;
    }
    catch {
        // token inválido, ignorar
    }
    next();
}
//# sourceMappingURL=auth.middleware.js.map