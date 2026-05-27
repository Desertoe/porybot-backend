import { Router } from 'express';
import * as communityController from '../controllers/community.controller';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware';

const router = Router();
router.get('/', optionalAuthMiddleware, communityController.getPublicTeams);
router.get('/rankings', communityController.getRankings);
router.post('/:id/like', authMiddleware, communityController.toggleLike);
router.post('/:id/save', authMiddleware, communityController.saveTeam);
export default router;
