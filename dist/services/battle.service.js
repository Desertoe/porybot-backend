"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBattle = createBattle;
exports.finishBattle = finishBattle;
exports.saveBattle = saveBattle;
exports.addBattleTurn = addBattleTurn;
exports.getUserBattles = getUserBattles;
exports.getBattleDetail = getBattleDetail;
const database_1 = require("../config/database");
async function createBattle(userId, botTeamId) {
    const battleId = crypto.randomUUID();
    await database_1.pool.query('INSERT INTO battles (id, user_id, bot_team_id) VALUES (?, ?, ?)', [battleId, userId, botTeamId]);
    const [rows] = await database_1.pool.query('SELECT * FROM battles WHERE id = ?', [battleId]);
    return rows[0];
}
async function finishBattle(battleId, result) {
    await database_1.pool.query('UPDATE battles SET result = ? WHERE id = ?', [result, battleId]);
}
async function saveBattle(battleId, userId) {
    await database_1.pool.query('UPDATE battles SET saved = TRUE WHERE id = ? AND user_id = ?', [battleId, userId]);
}
async function addBattleTurn(battleId, turnNum, logData, botReasoning) {
    await database_1.pool.query('INSERT INTO battle_turns (id, battle_id, turn_num, log_data, bot_reasoning) VALUES (UUID(), ?, ?, ?, ?)', [battleId, turnNum, JSON.stringify(logData), botReasoning]);
}
async function getUserBattles(userId, userRole) {
    const limit = userRole === 'user' ? 10 : 50;
    const [rows] = await database_1.pool.query(`SELECT b.*, t.name as bot_team_name, t.regulation 
     FROM battles b 
     LEFT JOIN teams t ON b.bot_team_id = t.id 
     WHERE b.user_id = ? 
     ORDER BY b.played_at DESC 
     LIMIT ?`, [userId, limit]);
    return rows;
}
async function getBattleDetail(battleId, userId) {
    const [rows] = await database_1.pool.query('SELECT * FROM battles WHERE id = ? AND user_id = ?', [battleId, userId]);
    if (rows.length === 0)
        throw new Error('Battle not found');
    const battle = rows[0];
    const [turns] = await database_1.pool.query('SELECT * FROM battle_turns WHERE battle_id = ? ORDER BY turn_num ASC', [battleId]);
    const parsedTurns = turns.map(t => ({ ...t, log_data: typeof t.log_data === 'string' ? JSON.parse(t.log_data) : t.log_data }));
    return { ...battle, turns: parsedTurns };
}
//# sourceMappingURL=battle.service.js.map