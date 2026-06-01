import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import * as authService from '../services/auth.service';

export async function register(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }
  try { const result = await authService.register(req.body.username, req.body.email, req.body.password); res.status(201).json(result); }
  catch (err: any) { res.status(409).json({ message: err.message }); }
}

export async function login(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }
  try { const result = await authService.login(req.body.email, req.body.password); res.json(result); }
  catch (err: any) { res.status(401).json({ message: err.message }); }
}

export async function getMe(req: Request, res: Response): Promise<void> {
  try { res.json(await authService.getProfile(req.user!.userId)); }
  catch (err: any) { res.status(404).json({ message: err.message }); }
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  try { res.json(await authService.updateProfile(req.user!.userId, req.body)); }
  catch (err: any) { res.status(400).json({ message: err.message }); }
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    await authService.forgotPassword(req.body.email);
    res.json({ message: 'Si ese email existe, recibirás un correo en breve' });
  } catch (err: any) {
    console.error('[forgotPassword ERROR]', err.message, err.code);
    res.status(500).json({ message: err.message });
  }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    await authService.resetPassword(req.body.token, req.body.password);
    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}