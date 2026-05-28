import { pool } from '../config/database';
import { Battle, BattleWithTurns, BattleTurn, BattleResult } from '../types';
import { randomUUID } from 'crypto';

export async function createBattle(userId: string, botTeamId: string | null): Promise<Battle> {
  const battleId = randomUUID();
  await pool.query('INSERT INTO battles (id, user_id, bot_team_id) VALUES (?, ?, ?)', [battleId, userId, botTeamId]);
  const [rows] = await pool.query<any[]>('SELECT * FROM battles WHERE id = ?', [battleId]);
  return rows[0] as Battle;
}

export async function finishBattle(battleId: string, result: BattleResult): Promise<void> {
  await pool.query('UPDATE battles SET result = ? WHERE id = ?', [result, battleId]);
}

export async function saveBattle(battleId: string, userId: string): Promise<void> {
  await pool.query('UPDATE battles SET saved = TRUE WHERE id = ? AND user_id = ?', [battleId, userId]);
}

export async function addBattleTurn(battleId: string, turnNum: number, logData: object, botReasoning: string | null): Promise<void> {
  await pool.query('INSERT INTO battle_turns (id, battle_id, turn_num, log_data, bot_reasoning) VALUES (UUID(), ?, ?, ?, ?)', [battleId, turnNum, JSON.stringify(logData), botReasoning]);
}

export async function getUserBattles(userId: string, userRole: string): Promise<Battle[]> {
  const limit = userRole === 'user' ? 10 : 50;
  const [rows] = await pool.query<any[]>(
    `SELECT b.*, t.name as bot_team_name, t.regulation 
     FROM battles b 
     LEFT JOIN teams t ON b.bot_team_id = t.id 
     WHERE b.user_id = ? 
     ORDER BY b.played_at DESC 
     LIMIT ?`,
    [userId, limit]
  );
  return rows as Battle[];
}

export async function getBattleDetail(battleId: string, userId: string): Promise<BattleWithTurns> {
  const [rows] = await pool.query<any[]>('SELECT * FROM battles WHERE id = ? AND user_id = ?', [battleId, userId]);
  if (rows.length === 0) throw new Error('Battle not found');
  const battle = rows[0] as Battle;
  const [turns] = await pool.query<any[]>('SELECT * FROM battle_turns WHERE battle_id = ? ORDER BY turn_num ASC', [battleId]);
  const parsedTurns = (turns as any[]).map(t => ({ ...t, log_data: typeof t.log_data === 'string' ? JSON.parse(t.log_data) : t.log_data })) as BattleTurn[];
  return { ...battle, turns: parsedTurns };
}
