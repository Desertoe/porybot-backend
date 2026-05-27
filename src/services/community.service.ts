import { pool } from '../config/database';
import { TeamWithPokemon } from '../types';
import { createTeam, getTeamById } from './team.service';

export async function getPublicTeams(userId: string | undefined, filters: { regulation?: string; species?: string; search?: string; sortBy?: 'likes' | 'saves' | 'recent'; page?: number; limit?: number }): Promise<{ teams: any[]; total: number }> {
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

  const params: any[] = [];
  if (userId) { params.push(userId, userId); }
  
  if (filters.regulation) { query += ' AND t.regulation = ?'; params.push(filters.regulation); }
  if (filters.search) { query += ' AND t.name LIKE ?'; params.push('%' + filters.search + '%'); }
  if (filters.species) { query += ' AND EXISTS (SELECT 1 FROM team_pokemon tp WHERE tp.team_id = t.id AND tp.species = ?)'; params.push(filters.species); }
  
  query += ' GROUP BY t.id, u.username';
  
  const sortMap: Record<string, string> = { likes: 'likes_count DESC', saves: 'saves_count DESC', recent: 't.created_at DESC' };
  query += ' ORDER BY ' + (sortMap[filters.sortBy || 'recent']);
  
  const [countRows] = await pool.query<any[]>('SELECT COUNT(*) as total FROM (' + query + ') as sub', params);
  const total = (countRows[0] as any).total;
  
  query += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);
  
  const [rows] = await pool.query<any[]>(query, params);
  return { teams: rows, total };
}

export async function toggleLike(userId: string, teamId: string): Promise<boolean> {
  const [existing] = await pool.query<any[]>('SELECT 1 FROM team_likes WHERE user_id = ? AND team_id = ?', [userId, teamId]);
  if (existing.length > 0) {
    await pool.query('DELETE FROM team_likes WHERE user_id = ? AND team_id = ?', [userId, teamId]);
    return false;
  }
  await pool.query('INSERT INTO team_likes (user_id, team_id) VALUES (?, ?)', [userId, teamId]);
  return true;
}

export async function savePublicTeam(userId: string, teamId: string): Promise<TeamWithPokemon> {
  await pool.query('INSERT IGNORE INTO team_saves (user_id, team_id) VALUES (?, ?)', [userId, teamId]);
  const original = await getTeamById(teamId);
  const copy = await createTeam(userId, 'premium', { name: original.name, regulation: original.regulation, paste: original.paste, type: 'personal' });
  await pool.query('UPDATE teams SET source_team_id = ? WHERE id = ?', [teamId, copy.id]);
  return copy;
}

export async function getRankings(): Promise<{ mostLiked: any[]; mostSaved: any[] }> {
  const [mostLiked] = await pool.query<any[]>('SELECT t.id, t.name, t.regulation, u.username as owner_username, COUNT(tl.user_id) as likes_count FROM teams t JOIN users u ON t.owner_id = u.id LEFT JOIN team_likes tl ON t.id = tl.team_id WHERE t.is_public = TRUE GROUP BY t.id, u.username ORDER BY likes_count DESC LIMIT 10');
  const [mostSaved] = await pool.query<any[]>('SELECT t.id, t.name, t.regulation, u.username as owner_username, COUNT(ts.user_id) as saves_count FROM teams t JOIN users u ON t.owner_id = u.id LEFT JOIN team_saves ts ON t.id = ts.team_id WHERE t.is_public = TRUE GROUP BY t.id, u.username ORDER BY saves_count DESC LIMIT 10');
  return { mostLiked, mostSaved };
}
