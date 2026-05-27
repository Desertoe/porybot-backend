export type Role = 'user' | 'admin' | 'premium';
export type Lang = 'es' | 'en';

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  showdown_nick: string | null;
  role: Role;
  lang: Lang;
  avatar: string | null;
  created_at: Date;
}

export type PublicUser = Omit<User, 'password_hash'>;

export type TeamType = 'personal' | 'bot' | 'internal';

export interface Team {
  id: string;
  owner_id: string | null;
  source_team_id: string | null;
  name: string;
  regulation: string;
  paste: string;
  type: TeamType;
  is_public: boolean;
  created_at: Date;
}

export interface TeamPokemon {
  id: string;
  team_id: string;
  slot: number;
  species: string;
  item: string | null;
  ability: string | null;
  tera_type: string | null;
}

export interface TeamWithPokemon extends Team {
  pokemon: TeamPokemon[];
  likes_count?: number;
  saves_count?: number;
  user_liked?: boolean;
  user_saved?: boolean;
  owner_username?: string;
}

export type BattleResult = 'win' | 'loss' | 'pending';

export interface Battle {
  id: string;
  user_id: string;
  bot_team_id: string | null;
  result: BattleResult;
  saved: boolean;
  played_at: Date;
  showdown_id: string | null;
  status: 'pending' | 'active' | 'finished';
}

export interface BattleTurn {
  id: string;
  battle_id: string;
  turn_num: number;
  log_data: object;
  bot_reasoning: string | null;
}

export interface BattleWithTurns extends Battle {
  turns: BattleTurn[];
}

export interface JwtPayload {
  userId: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}