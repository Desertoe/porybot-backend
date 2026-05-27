"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.getProfile = getProfile;
exports.updateProfile = updateProfile;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const env_1 = require("../config/env");
async function register(username, email, password) {
    const [existing] = await database_1.pool.query('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]);
    if (existing.length > 0)
        throw new Error('Email or username already in use');
    const password_hash = await bcryptjs_1.default.hash(password, 12);
    await database_1.pool.query('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)', [username, email, password_hash]);
    const [userRows] = await database_1.pool.query('SELECT id, username, email, showdown_nick, role, lang, avatar, created_at FROM users WHERE email = ?', [email]);
    const user = userRows[0];
    const token = signToken(user.id, user.role);
    return { user, token };
}
async function login(email, password) {
    const [rows] = await database_1.pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0)
        throw new Error('Invalid credentials');
    const user = rows[0];
    const valid = await bcryptjs_1.default.compare(password, user.password_hash);
    if (!valid)
        throw new Error('Invalid credentials');
    const { password_hash, ...publicUser } = user;
    const token = signToken(user.id, user.role);
    return { user: publicUser, token };
}
async function getProfile(userId) {
    const [rows] = await database_1.pool.query('SELECT id, username, email, showdown_nick, role, lang, avatar, created_at FROM users WHERE id = ?', [userId]);
    if (rows.length === 0)
        throw new Error('User not found');
    return rows[0];
}
async function updateProfile(userId, data) {
    const fields = [];
    const values = [];
    // Cambio de contraseña — requiere contraseña actual
    if (data.newPassword) {
        if (!data.currentPassword)
            throw new Error('Se requiere la contraseña actual');
        const [rows] = await database_1.pool.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
        if (rows.length === 0)
            throw new Error('Usuario no encontrado');
        const valid = await bcryptjs_1.default.compare(data.currentPassword, rows[0].password_hash);
        if (!valid)
            throw new Error('Contraseña actual incorrecta');
        if (data.newPassword.length < 6)
            throw new Error('La nueva contraseña debe tener al menos 6 caracteres');
        const newHash = await bcryptjs_1.default.hash(data.newPassword, 12);
        fields.push('password_hash = ?');
        values.push(newHash);
    }
    // Cambio de username — verificar que no esté en uso
    if (data.username !== undefined) {
        if (data.username.length < 3 || data.username.length > 30)
            throw new Error('El nombre de usuario debe tener entre 3 y 30 caracteres');
        const [existing] = await database_1.pool.query('SELECT id FROM users WHERE username = ? AND id != ?', [data.username, userId]);
        if (existing.length > 0)
            throw new Error('Nombre de usuario ya en uso');
        fields.push('username = ?');
        values.push(data.username);
    }
    // Cambio de email — verificar que no esté en uso
    if (data.email !== undefined) {
        const [existing] = await database_1.pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [data.email, userId]);
        if (existing.length > 0)
            throw new Error('Email ya en uso');
        fields.push('email = ?');
        values.push(data.email);
    }
    if (data.showdown_nick !== undefined) {
        fields.push('showdown_nick = ?');
        values.push(data.showdown_nick || null);
    }
    if (data.lang !== undefined) {
        fields.push('lang = ?');
        values.push(data.lang);
    }
    if (data.avatar !== undefined) {
        fields.push('avatar = ?');
        values.push(data.avatar || null);
    }
    if (fields.length === 0)
        throw new Error('Nothing to update');
    values.push(userId);
    await database_1.pool.query('UPDATE users SET ' + fields.join(', ') + ' WHERE id = ?', values);
    return getProfile(userId);
}
function signToken(userId, role) {
    return jsonwebtoken_1.default.sign({ userId, role }, env_1.env.jwt.secret, { expiresIn: env_1.env.jwt.expiresIn });
}
//# sourceMappingURL=auth.service.js.map