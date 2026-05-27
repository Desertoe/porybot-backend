import { Router } from 'express';
import * as teamController from '../controllers/team.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);
router.get('/', teamController.getMyTeams);
router.post('/', teamController.createTeam);
router.get('/:id', teamController.getTeam);
router.patch('/:id', teamController.updateTeam);
router.delete('/:id', teamController.deleteTeam);
export default router;
