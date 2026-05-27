import mysql from 'mysql2/promise';
import { env } from './env';

export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  user: env.db.user,
  password: env.db.password,
  waitForConnections: true,
  connectionLimit: 10,
  timezone: '+00:00',
});

export async function testConnection(): Promise<void> {
  const conn = await pool.getConnection();
  console.log('✅ MySQL connected');
  conn.release();
}
