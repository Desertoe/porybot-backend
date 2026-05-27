import { Router } from 'express';
import * as battleController from '../controllers/battle.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/notify-started', battleController.notifyBattleStarted);
router.post('/finish-by-tag', battleController.finishBattleByTag);
router.post('/turn-by-tag', battleController.addTurnByTag);

router.use(authMiddleware);
router.post('/', battleController.startBattle);
router.get('/', battleController.getBattles);
router.get('/:id', battleController.getBattle);
router.patch('/:id/save', battleController.saveBattle);
router.patch('/:id/finish', battleController.finishBattle);
router.post('/:id/turns', battleController.addTurn);
export default router;