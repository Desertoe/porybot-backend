import { Request, Response } from 'express';
import * as battleService from '../services/battle.service';
import { notifyUser, sendToBotSocket, isBotConnected, registerPendingBattle, getUserByNick, clearPendingBattle } from '../services/websocket.service';
import { pool } from '../config/database';
import { env } from '../config/env';

export async function startBattle(req: Request, res: Response): Promise<void> {
  try {
    const battle = await battleService.createBattle(req.user!.userId, req.body.botTeamId || null);

    const [users] = await pool.execute(
      'SELECT showdown_nick, username FROM users WHERE id = ?',
      [req.user!.userId]
    ) as any;
    const user = users[0];
    const showdownNick = user?.showdown_nick || user?.username;

    let regulation = 'regg';
    let botTeamPaste: string | null = null;
    if (req.body.botTeamId) {
      const [teams] = await pool.execute(
        'SELECT regulation, paste FROM teams WHERE id = ?',
        [req.body.botTeamId]
      ) as any;
      if (teams[0]?.regulation) {
        regulation = teams[0].regulation.toLowerCase().replace('reg ', 'reg').replace('.', '').replace('-', '').replace(' ', '');
        botTeamPaste = teams[0].paste || null;
      }
    }

    registerPendingBattle(req.user!.userId, showdownNick);

    if (isBotConnected()) {
      sendToBotSocket({
        type: 'start_battle',
        battleId: battle.id,
        nick: showdownNick,
        regulation,
        botTeamId: req.body.botTeamId || null,
        paste: botTeamPaste
      });
      console.log(`[Bot] Challenge enviado a ${showdownNick} en formato ${regulation}`);
    } else {
      console.log('[Bot] No conectado — el usuario deberá enviar el challenge manualmente');
    }

    res.status(201).json({ ...battle, botConnected: isBotConnected() });
  }
  catch (err: any) { res.status(400).json({ message: err.message }); }
}

export async function getBattles(req: Request, res: Response): Promise<void> {
  try { res.json(await battleService.getUserBattles(req.user!.userId, req.user!.role)); }
  catch (err: any) { res.status(400).json({ message: err.message }); }
}

export async function getBattle(req: Request, res: Response): Promise<void> {
  try { res.json(await battleService.getBattleDetail(req.params.id, req.user!.userId)); }
  catch (err: any) { res.status(404).json({ message: err.message }); }
}

export async function saveBattle(req: Request, res: Response): Promise<void> {
  try { await battleService.saveBattle(req.params.id, req.user!.userId); res.json({ message: 'Battle saved' }); }
  catch (err: any) { res.status(400).json({ message: err.message }); }
}

export async function finishBattle(req: Request, res: Response): Promise<void> {
  try { await battleService.finishBattle(req.params.id, req.body.result); res.json({ message: 'Battle updated' }); }
  catch (err: any) { res.status(400).json({ message: err.message }); }
}

export async function addTurn(req: Request, res: Response): Promise<void> {
  try { await battleService.addBattleTurn(req.params.id, req.body.turnNum, req.body.logData, req.body.botReasoning); res.status(201).json({ message: 'Turn added' }); }
  catch (err: any) { res.status(400).json({ message: err.message }); }
}

export async function notifyBattleStarted(req: Request, res: Response): Promise<void> {
  try {
    const botKey = req.headers['x-bot-key'];
    if (botKey !== env.jwt.secret) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }
    const { userNick, battleTag } = req.body;
    const userId = getUserByNick(userNick);
    if (userId) {
      await pool.execute(
        `UPDATE battles SET showdown_id = ?, status = 'active' 
         WHERE user_id = ? ORDER BY played_at DESC LIMIT 1`,
        [battleTag, userId]
      );
      notifyUser(userId, 'battle:started', { battleTag });
      clearPendingBattle(userNick);
    }
    res.json({ message: 'ok' });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

export async function finishBattleByTag(req: Request, res: Response): Promise<void> {
  try {
    const botKey = req.headers['x-bot-key'];
    if (botKey !== env.jwt.secret) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }
    const { battleTag, result } = req.body;
    await pool.execute(
      `UPDATE battles SET result = ?, status = 'finished' WHERE showdown_id = ?`,
      [result, battleTag]
    );
    console.log(`[Bot] Combate ${battleTag} finalizado: ${result}`);
    res.json({ message: 'ok' });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

export async function addTurnByTag(req: Request, res: Response): Promise<void> {
  try {
    const botKey = req.headers['x-bot-key'];
    if (botKey !== env.jwt.secret) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }
    const { battleTag, turnNum, logData, botReasoning } = req.body;
    const [battles] = await pool.execute(
      'SELECT id FROM battles WHERE showdown_id = ?',
      [battleTag]
    ) as any;
    if (battles[0]) {
      await battleService.addBattleTurn(battles[0].id, turnNum, logData, botReasoning);
    }
    res.json({ message: 'ok' });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}