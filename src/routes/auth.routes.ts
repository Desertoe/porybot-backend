import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
router.post('/register', [body('username').isLength({ min: 3, max: 30 }).trim(), body('email').isEmail().normalizeEmail(), body('password').isLength({ min: 6 })], authController.register);
router.post('/login', [body('email').isEmail().normalizeEmail(), body('password').notEmpty()], authController.login);
router.get('/me', authMiddleware, authController.getMe);
router.patch('/me', authMiddleware, authController.updateMe);
router.post('/forgot-password', [body('email').isEmail().normalizeEmail()], authController.forgotPassword);
router.post('/reset-password', [body('token').notEmpty(), body('password').isLength({ min: 6 })], authController.resetPassword);
export default router;
