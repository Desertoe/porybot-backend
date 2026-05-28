import { pool } from '../config/database';
import { Team, TeamWithPokemon, TeamPokemon, TeamType } from '../types';
import { randomUUID } from 'crypto';

export function parsePaste(paste: string): Omit<TeamPokemon, 'id' | 'team_id'>[] {
  const pokemon: Omit<TeamPokemon, 'id' | 'team_id'>[] = [];
  const blocks = paste.trim().split(/\n\s*\n/);
  blocks.forEach((block, index) => {
    if (index >= 6) return;
    const lines = block.trim().split('\n');
    if (!lines.length) return;
    const firstLine = lines[0];
    const atIndex = firstLine.indexOf(' @ ');
    const speciesPart = atIndex !== -1 ? firstLine.substring(0, atIndex) : firstLine;
    const item = atIndex !== -1 ? firstLine.substring(atIndex + 3).trim() : null;
    const species = speciesPart.replace(/\(M\)|\(F\)/g, '').split('(').pop()?.replace(')', '').trim() || speciesPart.trim();
    let ability: string | null = null;
    let tera_type: string | null = null;
    lines.forEach(line => {
      if (line.startsWith('Ability:')) ability = line.replace('Ability:', '').trim();
      if (line.startsWith('Tera Type:')) tera_type = line.replace('Tera Type:', '').trim();
    });
    pokemon.push({ slot: index + 1, species, item, ability, tera_type });
  });
  return pokemon;
}

async function validarEquipoShowdown(paste: string, regulation: string): Promise<void> {
  const formatoMap: Record<string, string> = {
    'Reg G': 'gen9vgc2024regg',
    'Reg F': 'gen9vgc2026regf',
    'Reg I': 'gen9vgc2026regi',
    'Reg M-A': 'gen9championsvgc2026regma',
  };

  const formato = formatoMap[regulation];
  if (!formato) return;

  try {
    const params = new URLSearchParams();
    params.append('team', paste);
    params.append('format', formato);

    const response = await fetch(
      'https://play.pokemonshowdown.com/~~showdown/action.php?act=validateteam',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      }
    );

    const text = await response.text();
    console.log('[Showdown raw response]:', text.substring(0, 500));
  } catch (err: any) {
    console.warn('[Validación Showdown] Error:', err.message);
  }
}

export async function createTeam(ownerId: string, userRole: string, data: { name: string; regulation: string; paste: string; type: TeamType }): Promise<TeamWithPokemon> {
  // Límite de equipos para usuarios básicos
  if (userRole === 'user') {
    const [existing] = await pool.query<any[]>(
      'SELECT COUNT(*) as count FROM teams WHERE owner_id = ? AND type = ?',
      [ownerId, data.type]
    );
    if (existing[0].count >= 3) {
      throw new Error('LIMIT_REACHED');
    }
  }

  // Validar equipo contra Showdown
  await validarEquipoShowdown(data.paste, data.regulation);
  const teamId = randomUUID();
  await pool.query('INSERT INTO teams (id, owner_id, name, regulation, paste, type) VALUES (?, ?, ?, ?, ?, ?)', [teamId, ownerId, data.name, data.regulation, data.paste, data.type]);
  const parsedPokemon = parsePaste(data.paste);
  for (const poke of parsedPokemon) {
    await pool.query('INSERT INTO team_pokemon (id, team_id, slot, species, item, ability, tera_type) VALUES (UUID(), ?, ?, ?, ?, ?, ?)', [teamId, poke.slot, poke.species, poke.item, poke.ability, poke.tera_type]);
  }
  return getTeamById(teamId, ownerId);
}

export async function getTeamById(teamId: string, userId?: string): Promise<TeamWithPokemon> {
  const [rows] = await pool.query<any[]>('SELECT * FROM teams WHERE id = ?', [teamId]);
  if (rows.length === 0) throw new Error('Team not found');
  const team = rows[0] as Team;
  const [pokemon] = await pool.query<any[]>('SELECT * FROM team_pokemon WHERE team_id = ? ORDER BY slot', [teamId]);
  const [[lk]] = await pool.query<any[]>('SELECT COUNT(*) as likes_count FROM team_likes WHERE team_id = ?', [teamId]) as any;
  const [[sv]] = await pool.query<any[]>('SELECT COUNT(*) as saves_count FROM team_saves WHERE team_id = ?', [teamId]) as any;
  let user_liked = false, user_saved = false;
  if (userId) {
    const [lr] = await pool.query<any[]>('SELECT 1 FROM team_likes WHERE user_id = ? AND team_id = ?', [userId, teamId]);
    user_liked = lr.length > 0;
    const [sr] = await pool.query<any[]>('SELECT 1 FROM team_saves WHERE user_id = ? AND team_id = ?', [userId, teamId]);
    user_saved = sr.length > 0;
  }
  return { ...team, pokemon, likes_count: lk.likes_count, saves_count: sv.saves_count, user_liked, user_saved };
}

export async function getUserTeams(ownerId: string, filters: { type?: TeamType; regulation?: string; species?: string; search?: string }): Promise<Team[]> {
  let query = 'SELECT DISTINCT t.* FROM teams t WHERE t.owner_id = ?';
  const params: any[] = [ownerId];
  if (filters.type) { query += ' AND t.type = ?'; params.push(filters.type); }
  if (filters.regulation) { query += ' AND t.regulation = ?'; params.push(filters.regulation); }
  if (filters.search) { query += ' AND t.name LIKE ?'; params.push('%' + filters.search + '%'); }
  if (filters.species) { query += ' AND EXISTS (SELECT 1 FROM team_pokemon tp WHERE tp.team_id = t.id AND tp.species = ?)'; params.push(filters.species); }
  query += ' ORDER BY t.created_at DESC';
  const [rows] = await pool.query<any[]>(query, params);
  return rows as Team[];
}

export async function updateTeam(teamId: string, ownerId: string, data: Partial<{ name: string; is_public: boolean; regulation: string; paste: string }>): Promise<TeamWithPokemon> {
  const fields: string[] = [];
  const values: any[] = [];
  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.is_public !== undefined) { fields.push('is_public = ?'); values.push(data.is_public); }
  if (data.regulation !== undefined) { fields.push('regulation = ?'); values.push(data.regulation); }
  if (data.paste !== undefined) { fields.push('paste = ?'); values.push(data.paste); }
  if (fields.length === 0) throw new Error('Nothing to update');
  values.push(teamId, ownerId);
  await pool.query('UPDATE teams SET ' + fields.join(', ') + ' WHERE id = ? AND owner_id = ?', values);
  if (data.paste) {
    await pool.query('DELETE FROM team_pokemon WHERE team_id = ?', [teamId]);
    for (const poke of parsePaste(data.paste)) {
      await pool.query('INSERT INTO team_pokemon (id, team_id, slot, species, item, ability, tera_type) VALUES (UUID(), ?, ?, ?, ?, ?, ?)', [teamId, poke.slot, poke.species, poke.item, poke.ability, poke.tera_type]);
    }
  }
  return getTeamById(teamId, ownerId);
}

export async function deleteTeam(teamId: string, ownerId: string): Promise<void> {
  const [result] = await pool.query<any>('DELETE FROM teams WHERE id = ? AND owner_id = ?', [teamId, ownerId]);
  if (result.affectedRows === 0) throw new Error('Team not found or unauthorized');
}
