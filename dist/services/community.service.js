"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicTeams = getPublicTeams;
exports.toggleLike = toggleLike;
exports.savePublicTeam = savePublicTeam;
exports.getRankings = getRankings;
const database_1 = require("../config/database");
const team_service_1 = require("./team.service");
async function getPublicTeams(userId, filters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;
    let query = `SELECT t.*, u.username as owner_username, u.avatar as owner_avatar,
    COUNT(DISTINCT tl.user_id) as likes_count, 
    COUNT(DISTINCT ts.user_id) as saves_count,
    ${userId ? 'SUM(CASE WHEN tl2.user_id = ? THEN 1 ELSE 0 END) > 0' : '0'} as user_liked,
    ${userId ? 'SUM(CASE WHEN ts2.user_id = ? THEN 1 ELSE 0 END) > 0' : '0'} as user_saved
    FROM teams t 
    JOIN users u ON t.owner_id = u.id 
    LEFT JOIN team_likes tl ON t.id = tl.team_id 
    LEFT JOIN team_saves ts ON t.id = ts.team_id
    ${userId ? 'LEFT JOIN team_likes tl2 ON t.id = tl2.team_id LEFT JOIN team_saves ts2 ON t.id = ts2.team_id' : ''}
    WHERE t.is_public = TRUE`;
    const params = [];
    if (userId) {
        params.push(userId, userId);
    }
    if (filters.regulation) {
        query += ' AND t.regulation = ?';
        params.push(filters.regulation);
    }
    if (filters.search) {
        query += ' AND t.name LIKE ?';
        params.push('%' + filters.search + '%');
    }
    if (filters.species) {
        query += ' AND EXISTS (SELECT 1 FROM team_pokemon tp WHERE tp.team_id = t.id AND tp.species = ?)';
        params.push(filters.species);
    }
    query += ' GROUP BY t.id, u.username';
    const sortMap = { likes: 'likes_count DESC', saves: 'saves_count DESC', recent: 't.created_at DESC' };
    query += ' ORDER BY ' + (sortMap[filters.sortBy || 'recent']);
    const [countRows] = await database_1.pool.query('SELECT COUNT(*) as total FROM (' + query + ') as sub', params);
    const total = countRows[0].total;
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);
    const [rows] = await database_1.pool.query(query, params);
    return { teams: rows, total };
}
async function toggleLike(userId, teamId) {
    const [existing] = await database_1.pool.query('SELECT 1 FROM team_likes WHERE user_id = ? AND team_id = ?', [userId, teamId]);
    if (existing.length > 0) {
        await database_1.pool.query('DELETE FROM team_likes WHERE user_id = ? AND team_id = ?', [userId, teamId]);
        return false;
    }
    await database_1.pool.query('INSERT INTO team_likes (user_id, team_id) VALUES (?, ?)', [userId, teamId]);
    return true;
}
async function savePublicTeam(userId, teamId) {
    await database_1.pool.query('INSERT IGNORE INTO team_saves (user_id, team_id) VALUES (?, ?)', [userId, teamId]);
    const original = await (0, team_service_1.getTeamById)(teamId);
    const copy = await (0, team_service_1.createTeam)(userId, 'premium', { name: original.name, regulation: original.regulation, paste: original.paste, type: 'personal' });
    await database_1.pool.query('UPDATE teams SET source_team_id = ? WHERE id = ?', [teamId, copy.id]);
    return copy;
}
async function getRankings() {
    const [mostLiked] = await database_1.pool.query('SELECT t.id, t.name, t.regulation, u.username as owner_username, COUNT(tl.user_id) as likes_count FROM teams t JOIN users u ON t.owner_id = u.id LEFT JOIN team_likes tl ON t.id = tl.team_id WHERE t.is_public = TRUE GROUP BY t.id, u.username ORDER BY likes_count DESC LIMIT 10');
    const [mostSaved] = await database_1.pool.query('SELECT t.id, t.name, t.regulation, u.username as owner_username, COUNT(ts.user_id) as saves_count FROM teams t JOIN users u ON t.owner_id = u.id LEFT JOIN team_saves ts ON t.id = ts.team_id WHERE t.is_public = TRUE GROUP BY t.id, u.username ORDER BY saves_count DESC LIMIT 10');
    return { mostLiked, mostSaved };
}
//# sourceMappingURL=community.service.js.map