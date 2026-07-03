-- ============================================================
--  Copa México VALORANT 2026 · esquema de base de datos
--  Postgres (Neon / Supabase / Vercel Postgres)
--  Idempotente: se puede ejecutar varias veces sin romper.
-- ============================================================

-- Usuarios del Comité Organizador (rol CO).
CREATE TABLE IF NOT EXISTS co_user (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username      text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  nombre        text NOT NULL DEFAULT 'Comité Organizador',
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Torneos (el CO puede crear varias ediciones).
CREATE TABLE IF NOT EXISTS tournament (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      text NOT NULL,
  edicion     text NOT NULL DEFAULT 'Edición I',
  temporada   text NOT NULL DEFAULT '2026',
  version     text NOT NULL DEFAULT 'v1.3',
  estado      text NOT NULL DEFAULT 'borrador'
              CHECK (estado IN ('borrador','inscripciones','en_curso','finalizado')),
  cupo_max    integer NOT NULL DEFAULT 64,
  cuota       text NOT NULL DEFAULT 'Por definir',
  bolsa       text NOT NULL DEFAULT 'Por definir',
  servidor    text NOT NULL DEFAULT 'LATAM-N / México',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Equipos. El login es NOMBRE#TAG (único a nivel global).
CREATE TABLE IF NOT EXISTS team (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id      uuid REFERENCES tournament(id) ON DELETE SET NULL,
  nombre             text NOT NULL,
  tag                text NOT NULL,
  rama               text NOT NULL DEFAULT 'amateur'
                     CHECK (rama IN ('amateur','elite')),
  estado             text NOT NULL DEFAULT 'borrador'
                     CHECK (estado IN ('borrador','pendiente_pago','en_revision','aprobado','rechazado','lista_espera')),
  password_hash      text NOT NULL,
  orden_inscripcion  integer,
  roster_locked      boolean NOT NULL DEFAULT false,
  nota_co            text,
  created_at         timestamptz NOT NULL DEFAULT now()
);

-- Identificador de login case-insensitive único.
CREATE UNIQUE INDEX IF NOT EXISTS team_login_uidx
  ON team (lower(nombre), lower(tag));

-- Jugadores del roster de un equipo.
CREATE TABLE IF NOT EXISTS player (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id          uuid NOT NULL REFERENCES team(id) ON DELETE CASCADE,
  nombre           text NOT NULL DEFAULT '',
  riot_id          text NOT NULL DEFAULT '',
  rank_id          text NOT NULL DEFAULT 'hierro_oro'
                   CHECK (rank_id IN ('hierro_oro','platino','diamante','ascendente','inmortal','radiante')),
  nacionalidad     text NOT NULL DEFAULT 'MX',
  rol              text NOT NULL DEFAULT 'titular'
                   CHECK (rol IN ('titular','suplente')),
  es_capitan       boolean NOT NULL DEFAULT false,
  riot_verificado  boolean NOT NULL DEFAULT false,
  orden            integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS player_team_idx ON player (team_id);
