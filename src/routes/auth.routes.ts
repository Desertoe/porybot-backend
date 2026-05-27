import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
router.post('/register', [body('username').isLength({ min: 3, max: 30 }).trim(), body('email').isEmail().normalizeEmail(), body('password').isLength({ min: 6 })], authController.register);
router.post('/login', [body('email').isEmail().normalizeEmail(), body('password').notEmpty()], authController.login);
router.get('/me', authMiddleware, authController.getMe);
router.patch('/me', authMiddleware, authController.updateMe);
export default router;
