import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { env } from '../config/env';
import { User, PublicUser, JwtPayload } from '../types';

export async function register(username: string, email: string, password: string): Promise<{ user: PublicUser; token: string }> {
  const [existing] = await pool.query<any[]>('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]);
  if (existing.length > 0) throw new Error('Email or username already in use');

  const password_hash = await bcrypt.hash(password, 12);
  await pool.query('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)', [username, email, password_hash]);

  const [userRows] = await pool.query<any[]>('SELECT id, username, email, showdown_nick, role, lang, avatar, created_at FROM users WHERE email = ?', [email]);
  const user = userRows[0] as PublicUser;
  const token = signToken(user.id, user.role);
  return { user, token };
}

export async function login(email: string, password: string): Promise<{ user: PublicUser; token: string }> {
  const [rows] = await pool.query<any[]>('SELECT * FROM users WHERE email = ?', [email]);
  if (rows.length === 0) throw new Error('Invalid credentials');

  const user = rows[0] as User;
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new Error('Invalid credentials');

  const { password_hash, ...publicUser } = user;
  const token = signToken(user.id, user.role);
  return { user: publicUser as PublicUser, token };
}

export async function getProfile(userId: string): Promise<PublicUser> {
  const [rows] = await pool.query<any[]>('SELECT id, username, email, showdown_nick, role, lang, avatar, created_at FROM users WHERE id = ?', [userId]);
  if (rows.length === 0) throw new Error('User not found');
  return rows[0] as PublicUser;
}

export async function updateProfile(userId: string, data: {
  username?: string;
  email?: string;
  showdown_nick?: string;
  lang?: string;
  avatar?: string;
  currentPassword?: string;
  newPassword?: string;
}): Promise<PublicUser> {
  const fields: string[] = [];
  const values: any[] = [];

  // Cambio de contraseña — requiere contraseña actual
  if (data.newPassword) {
    if (!data.currentPassword) throw new Error('Se requiere la contraseña actual');
    const [rows] = await pool.query<any[]>('SELECT password_hash FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) throw new Error('Usuario no encontrado');
    const valid = await bcrypt.compare(data.currentPassword, rows[0].password_hash);
    if (!valid) throw new Error('Contraseña actual incorrecta');
    if (data.newPassword.length < 6) throw new Error('La nueva contraseña debe tener al menos 6 caracteres');
    const newHash = await bcrypt.hash(data.newPassword, 12);
    fields.push('password_hash = ?');
    values.push(newHash);
  }

  // Cambio de username — verificar que no esté en uso
  if (data.username !== undefined) {
    if (data.username.length < 3 || data.username.length > 30) throw new Error('El nombre de usuario debe tener entre 3 y 30 caracteres');
    const [existing] = await pool.query<any[]>('SELECT id FROM users WHERE username = ? AND id != ?', [data.username, userId]);
    if (existing.length > 0) throw new Error('Nombre de usuario ya en uso');
    fields.push('username = ?');
    values.push(data.username);
  }

  // Cambio de email — verificar que no esté en uso
  if (data.email !== undefined) {
    const [existing] = await pool.query<any[]>('SELECT id FROM users WHERE email = ? AND id != ?', [data.email, userId]);
    if (existing.length > 0) throw new Error('Email ya en uso');
    fields.push('email = ?');
    values.push(data.email);
  }

  if (data.showdown_nick !== undefined) { fields.push('showdown_nick = ?'); values.push(data.showdown_nick || null); }
  if (data.lang !== undefined) { fields.push('lang = ?'); values.push(data.lang); }
  if (data.avatar !== undefined) { fields.push('avatar = ?'); values.push(data.avatar || null); }

  if (fields.length === 0) throw new Error('Nothing to update');
  values.push(userId);
  await pool.query('UPDATE users SET ' + fields.join(', ') + ' WHERE id = ?', values);
  return getProfile(userId);
}

function signToken(userId: string, role: string): string {
  return jwt.sign({ userId, role } as JwtPayload, env.jwt.secret, { expiresIn: env.jwt.expiresIn } as any);
}