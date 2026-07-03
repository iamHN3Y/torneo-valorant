import { sql } from "./db";
import type { RankId, Rol, Rama, EstadoInscripcion } from "./types";

/* ------------------------------ Tipos ------------------------------ */

export interface DbCoUser {
  id: string;
  username: string;
  passwordHash: string;
  nombre: string;
}

export interface DbTeam {
  id: string;
  tournamentId: string | null;
  nombre: string;
  tag: string;
  rama: Rama;
  estado: EstadoInscripcion;
  ordenInscripcion: number | null;
  rosterLocked: boolean;
  notaCo: string | null;
  createdAt: string;
}

export interface DbPlayer {
  id: string;
  teamId: string;
  nombre: string;
  riotId: string;
  rankId: RankId;
  nacionalidad: string;
  rol: Rol;
  esCapitan: boolean;
  riotVerificado: boolean;
  orden: number;
}

export interface PlayerInput {
  nombre: string;
  riotId: string;
  rankId: RankId;
  nacionalidad: string;
  rol: Rol;
  esCapitan: boolean;
  riotVerificado: boolean;
}

export type TournamentEstado =
  | "borrador"
  | "inscripciones"
  | "en_curso"
  | "finalizado";

export interface DbTournament {
  id: string;
  nombre: string;
  edicion: string;
  temporada: string;
  estado: TournamentEstado;
  cupoMax: number;
  servidor: string;
}

/* ------------------------------ CO ------------------------------ */

export async function getCoUserByUsername(
  username: string
): Promise<DbCoUser | null> {
  const rows = await sql<DbCoUser[]>`
    select id, username, password_hash, nombre
    from co_user
    where lower(username) = lower(${username})
    limit 1
  `;
  return rows[0] ?? null;
}

/* ------------------------------ Equipos ------------------------------ */

/** Busca equipo por su login NOMBRE#TAG (incluye el hash para verificar). */
export async function getTeamByLogin(
  nombre: string,
  tag: string
): Promise<(DbTeam & { passwordHash: string }) | null> {
  const rows = await sql<(DbTeam & { passwordHash: string })[]>`
    select id, tournament_id, nombre, tag, rama, estado, orden_inscripcion,
           roster_locked, nota_co, created_at, password_hash
    from team
    where lower(nombre) = lower(${nombre}) and lower(tag) = lower(${tag})
    limit 1
  `;
  return rows[0] ?? null;
}

export async function getTeamById(id: string): Promise<DbTeam | null> {
  const rows = await sql<DbTeam[]>`
    select id, tournament_id, nombre, tag, rama, estado, orden_inscripcion,
           roster_locked, nota_co, created_at
    from team where id = ${id} limit 1
  `;
  return rows[0] ?? null;
}

export async function getPlayers(teamId: string): Promise<DbPlayer[]> {
  return sql<DbPlayer[]>`
    select id, team_id, nombre, riot_id, rank_id, nacionalidad, rol,
           es_capitan, riot_verificado, orden
    from player
    where team_id = ${teamId}
    order by orden asc
  `;
}

/** Reemplaza el roster completo de un equipo (transacción). */
export async function saveRoster(
  teamId: string,
  players: PlayerInput[]
): Promise<void> {
  const rows = players.map((p, i) => ({
    teamId,
    nombre: p.nombre,
    riotId: p.riotId,
    rankId: p.rankId,
    nacionalidad: p.nacionalidad,
    rol: p.rol,
    esCapitan: p.esCapitan,
    riotVerificado: p.riotVerificado,
    orden: i,
  }));

  await sql.begin(async (tx) => {
    await tx`delete from player where team_id = ${teamId}`;
    if (rows.length > 0) {
      await tx`insert into player ${tx(
        rows,
        "teamId",
        "nombre",
        "riotId",
        "rankId",
        "nacionalidad",
        "rol",
        "esCapitan",
        "riotVerificado",
        "orden"
      )}`;
    }
  });
}

/** Lista de equipos (opcionalmente de un torneo) para el panel del CO. */
export async function listTeams(tournamentId?: string): Promise<DbTeam[]> {
  if (tournamentId) {
    return sql<DbTeam[]>`
      select id, tournament_id, nombre, tag, rama, estado, orden_inscripcion,
             roster_locked, nota_co, created_at
      from team where tournament_id = ${tournamentId}
      order by orden_inscripcion asc nulls last, created_at asc
    `;
  }
  return sql<DbTeam[]>`
    select id, tournament_id, nombre, tag, rama, estado, orden_inscripcion,
           roster_locked, nota_co, created_at
    from team
    order by orden_inscripcion asc nulls last, created_at asc
  `;
}

/** Crea un equipo con su roster en una sola transacción. Devuelve el id.
 *  El orden de inscripción se asigna automáticamente (siguiente disponible). */
export async function createTeam(
  input: {
    tournamentId: string | null;
    nombre: string;
    tag: string;
    rama: Rama;
    estado: EstadoInscripcion;
    passwordHash: string;
  },
  players: PlayerInput[]
): Promise<string> {
  return sql.begin(async (tx) => {
    const [team] = await tx<{ id: string }[]>`
      insert into team (tournament_id, nombre, tag, rama, estado, password_hash, orden_inscripcion)
      values (
        ${input.tournamentId},
        ${input.nombre},
        ${input.tag},
        ${input.rama},
        ${input.estado},
        ${input.passwordHash},
        (select coalesce(max(orden_inscripcion), 0) + 1 from team)
      )
      returning id
    `;
    const rows = players.map((p, i) => ({
      teamId: team.id,
      nombre: p.nombre,
      riotId: p.riotId,
      rankId: p.rankId,
      nacionalidad: p.nacionalidad,
      rol: p.rol,
      esCapitan: p.esCapitan,
      riotVerificado: p.riotVerificado,
      orden: i,
    }));
    if (rows.length > 0) {
      await tx`insert into player ${tx(
        rows,
        "teamId",
        "nombre",
        "riotId",
        "rankId",
        "nacionalidad",
        "rol",
        "esCapitan",
        "riotVerificado",
        "orden"
      )}`;
    }
    return team.id;
  });
}

/* ------------------------------ Torneos ------------------------------ */

export async function getActiveTournament(): Promise<DbTournament | null> {
  const rows = await sql<DbTournament[]>`
    select id, nombre, edicion, temporada, estado, cupo_max, servidor
    from tournament
    where estado in ('inscripciones','en_curso')
    order by created_at desc
    limit 1
  `;
  return rows[0] ?? null;
}

export async function listTournaments(): Promise<DbTournament[]> {
  return sql<DbTournament[]>`
    select id, nombre, edicion, temporada, estado, cupo_max, servidor
    from tournament order by created_at desc
  `;
}

export async function createTournament(nombre: string): Promise<void> {
  await sql`insert into tournament (nombre, estado) values (${nombre}, 'borrador')`;
}

export async function updateTournamentEstado(
  id: string,
  estado: TournamentEstado
): Promise<void> {
  await sql`update tournament set estado = ${estado} where id = ${id}`;
}

/* ------------------------- Acciones del CO sobre equipos ------------------------- */

export async function updateTeamEstado(
  id: string,
  estado: EstadoInscripcion
): Promise<void> {
  await sql`update team set estado = ${estado} where id = ${id}`;
}

export async function setRosterLock(id: string, locked: boolean): Promise<void> {
  await sql`update team set roster_locked = ${locked} where id = ${id}`;
}

export async function setTeamNota(id: string, nota: string): Promise<void> {
  await sql`update team set nota_co = ${nota || null} where id = ${id}`;
}
