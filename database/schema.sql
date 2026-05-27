CREATE DATABASE IF NOT EXISTS porybot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE porybot;

CREATE TABLE users (
  id            CHAR(36)      NOT NULL DEFAULT (UUID()),
  username      VARCHAR(30)   NOT NULL UNIQUE,
  email         VARCHAR(255)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  showdown_nick VARCHAR(50)   NULL,
  role          ENUM('user','admin') NOT NULL DEFAULT 'user',
  lang          ENUM('es','en')      NOT NULL DEFAULT 'es',
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE teams (
  id             CHAR(36)     NOT NULL DEFAULT (UUID()),
  owner_id       CHAR(36)     NULL,
  source_team_id CHAR(36)     NULL,
  name           VARCHAR(100) NOT NULL,
  regulation     VARCHAR(20)  NOT NULL,
  paste          TEXT         NOT NULL,
  type           ENUM('personal','bot','internal') NOT NULL DEFAULT 'personal',
  is_public      BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (owner_id)       REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (source_team_id) REFERENCES teams(id) ON DELETE SET NULL
);

CREATE TABLE team_pokemon (
  id        CHAR(36)    NOT NULL DEFAULT (UUID()),
  team_id   CHAR(36)    NOT NULL,
  slot      TINYINT     NOT NULL,
  species   VARCHAR(50) NOT NULL,
  item      VARCHAR(50) NULL,
  ability   VARCHAR(50) NULL,
  tera_type VARCHAR(20) NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE TABLE battles (
  id          CHAR(36)  NOT NULL DEFAULT (UUID()),
  user_id     CHAR(36)  NOT NULL,
  bot_team_id CHAR(36)  NULL,
  result      ENUM('win','loss','pending') NOT NULL DEFAULT 'pending',
  saved       BOOLEAN   NOT NULL DEFAULT FALSE,
  played_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (bot_team_id) REFERENCES teams(id) ON DELETE SET NULL
);

CREATE TABLE battle_turns (
  id            CHAR(36)  NOT NULL DEFAULT (UUID()),
  battle_id     CHAR(36)  NOT NULL,
  turn_num      SMALLINT  NOT NULL,
  log_data      JSON      NOT NULL,
  bot_reasoning TEXT      NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (battle_id) REFERENCES battles(id) ON DELETE CASCADE
);

CREATE TABLE team_likes (
  user_id  CHAR(36)  NOT NULL,
  team_id  CHAR(36)  NOT NULL,
  liked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, team_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE TABLE team_saves (
  user_id  CHAR(36)  NOT NULL,
  team_id  CHAR(36)  NOT NULL,
  saved_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, team_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE INDEX idx_teams_owner       ON teams(owner_id);
CREATE INDEX idx_teams_type_public ON teams(type, is_public);
CREATE INDEX idx_battle_turns      ON battle_turns(battle_id, turn_num);
