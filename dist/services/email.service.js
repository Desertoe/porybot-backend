"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPasswordResetEmail = sendPasswordResetEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("../config/env");
const transporter = nodemailer_1.default.createTransport({
    host: env_1.env.email.host,
    port: env_1.env.email.port,
    secure: false,
    auth: { user: env_1.env.email.user, pass: env_1.env.email.pass },
});
async function sendPasswordResetEmail(to, token) {
    const resetUrl = `${process.env.FRONTEND_URL || 'https://dreamy-melba-629b75.netlify.app'}/auth/reset-password?token=${token}`;
    await transporter.sendMail({
        from: env_1.env.email.from,
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
//# sourceMappingURL=email.service.js.map