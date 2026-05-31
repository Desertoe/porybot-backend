import nodemailer from 'nodemailer';
import { env } from '../config/env';

const transporter = nodemailer.createTransport({
  host: env.email.host,
  port: env.email.port,
  secure: false,
  auth: { user: env.email.user, pass: env.email.pass },
});

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const resetUrl = `${process.env.FRONTEND_URL || 'https://dreamy-melba-629b75.netlify.app'}/auth/reset-password?token=${token}`;
  await transporter.sendMail({
    from: env.email.from,
    to,
    subject: 'Recuperar contraseña — PoryBot',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0D0F1A;color:#E8E4F0;border-radius:12px">
        <h2 style="color:#E8417A;margin-bottom:16px">Recuperar contraseña</h2>
        <p style="margin-bottom:24px">Has solicitado restablecer tu contraseña en PoryBot. Pulsa el botón para crear una nueva contraseña:</p>
        <a href="${resetUrl}" style="display:inline-block;background:#E8417A;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin-bottom:24px">Restablecer contraseña</a>
        <p style="font-size:13px;color:#6070A0">Este enlace caduca en 1 hora. Si no solicitaste el cambio, ignora este correo.</p>
      </div>
    `,
  });
}