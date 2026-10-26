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

-- Torneos gratuitos vs. de pago (por defecto gratuito).
ALTER TABLE tournament ADD COLUMN IF NOT EXISTS gratuito boolean NOT NULL DEFAULT true;

-- ============================================================
--  Fase 6: ceremonial de sorteo de grupos
-- ============================================================

-- Momento en que el CO publicó el sorteo de grupos (revela la asignación de
-- equipos a grupos en las vistas públicas). Nula mientras el sorteo está
-- pendiente.
ALTER TABLE tournament ADD COLUMN IF NOT EXISTS sorteo_publicado_at timestamptz;

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

-- ============================================================
--  Fase 5: identidad visual por equipo (acento de color, paleta cerrada)
-- ============================================================

-- Acento de color del equipo (paleta cerrada de 6, ninguno reutiliza
-- --color-brand/--color-teal/--color-gold de la UI existente).
ALTER TABLE team ADD COLUMN IF NOT EXISTS accent text NOT NULL DEFAULT 'azul'
  CHECK (accent IN ('violeta','azul','cobalto','magenta','lima','rosa'));

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

-- ============================================================
--  Fase competitiva: grupos y partidos
-- ============================================================

-- Grupos de la fase de grupos (A, B, C...).
CREATE TABLE IF NOT EXISTS tournament_group (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournament(id) ON DELETE CASCADE,
  nombre        text NOT NULL,
  orden         integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Pertenencia de equipos a grupos.
CREATE TABLE IF NOT EXISTS tournament_group_team (
  group_id uuid NOT NULL REFERENCES tournament_group(id) ON DELETE CASCADE,
  team_id  uuid NOT NULL REFERENCES team(id) ON DELETE CASCADE,
  PRIMARY KEY (group_id, team_id)
);

-- Partidos (series). group_id NULL = playoffs/bracket.
CREATE TABLE IF NOT EXISTS tournament_match (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournament(id) ON DELETE CASCADE,
  group_id      uuid REFERENCES tournament_group(id) ON DELETE SET NULL,
  ronda         text NOT NULL,          -- "Grupo A", "Cuartos", "Semifinal", "Gran Final"
  formato       text NOT NULL DEFAULT 'Bo3' CHECK (formato IN ('Bo1','Bo3','Bo5')),
  team_a_id     uuid REFERENCES team(id) ON DELETE SET NULL,
  team_b_id     uuid REFERENCES team(id) ON DELETE SET NULL,
  score_a       integer NOT NULL DEFAULT 0,
  score_b       integer NOT NULL DEFAULT 0,
  estado        text NOT NULL DEFAULT 'programado'
                CHECK (estado IN ('programado','en_vivo','finalizado')),
  fecha         timestamptz,
  orden         integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS match_tournament_idx ON tournament_match (tournament_id);
CREATE INDEX IF NOT EXISTS match_group_idx ON tournament_match (group_id);

-- Ajustes manuales de ranking del CO (Art. 43: bonos por rival superior,
-- consistencia, y penalizaciones por W.O. o disciplina).
CREATE TABLE IF NOT EXISTS ranking_adjustment (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id    uuid NOT NULL REFERENCES team(id) ON DELETE CASCADE,
  puntos     integer NOT NULL,
  motivo     text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ranking_adjustment_team_idx ON ranking_adjustment (team_id);

-- ============================================================
--  Fase 3: auditoría del Comité Organizador + timestamp de cierre
-- ============================================================

-- Momento en que un partido pasó a 'finalizado' (para trazabilidad/orden).
ALTER TABLE tournament_match ADD COLUMN IF NOT EXISTS finalizado_at timestamptz;

-- Backfill de partidos ya finalizados antes de que existiera esta columna.
UPDATE tournament_match SET finalizado_at = coalesce(fecha, created_at)
  WHERE estado = 'finalizado' AND finalizado_at IS NULL;

-- Bitácora de auditoría append-only de todas las acciones mutantes del CO.
-- co_user_id es NOT NULL con ON DELETE RESTRICT: nunca queremos que borrar
-- un usuario CO deje huérfana o nula una entrada de auditoría (si algún día
-- se necesita borrar un co_user con historial, debe manejarse explícitamente).
CREATE TABLE IF NOT EXISTS audit_log (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  co_user_id         uuid NOT NULL REFERENCES co_user(id) ON DELETE RESTRICT,
  tipo               text NOT NULL
                      CONSTRAINT audit_log_tipo_check
                      CHECK (tipo IN ('match_result','match_delete','match_create','team_estado','roster_lock','team_nota','adjustment_create','adjustment_delete','revert','tournament_create','tournament_estado','tournament_gratuito','tournament_cuota','group_create','group_team_add','group_team_remove')),
  entidad_id         uuid,
  revierte_audit_id  uuid REFERENCES audit_log(id) ON DELETE SET NULL,
  before_data        jsonb,
  after_data         jsonb,
  descripcion        text NOT NULL,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_log_created_idx ON audit_log (created_at DESC);

-- Migraciones reales para bases de datos donde audit_log ya existía con el
-- CHECK/FK anteriores (CREATE TABLE IF NOT EXISTS no los actualiza). Ambas
-- son idempotentes: DROP ... IF EXISTS + ADD con el mismo nombre de destino.
ALTER TABLE audit_log DROP CONSTRAINT IF EXISTS audit_log_tipo_check;
ALTER TABLE audit_log ADD CONSTRAINT audit_log_tipo_check CHECK (tipo IN ('match_result','match_delete','match_create','team_estado','roster_lock','team_nota','adjustment_create','adjustment_delete','revert','tournament_create','tournament_estado','tournament_gratuito','tournament_cuota','group_create','group_team_add','group_team_remove','sorteo_publish'));
ALTER TABLE audit_log DROP CONSTRAINT IF EXISTS audit_log_co_user_id_fkey;
ALTER TABLE audit_log ADD CONSTRAINT audit_log_co_user_id_fkey FOREIGN KEY (co_user_id) REFERENCES co_user(id) ON DELETE RESTRICT;
