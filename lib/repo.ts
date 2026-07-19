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
  gratuito: boolean;
  cuota: string;
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

/** Cuenta equipos que ocupan un cupo (no rechazados ni en lista de espera). */
export async function countTeamsOccupyingSlot(
  tournamentId: string
): Promise<number> {
  const rows = await sql<{ count: number }[]>`
    select count(*)::int as count
    from team
    where tournament_id = ${tournamentId}
      and estado in ('pendiente_pago','en_revision','aprobado')
  `;
  return Number(rows[0]?.count ?? 0);
}

const TOURNAMENT_COLUMNS = sql`
  id, nombre, edicion, temporada, estado, cupo_max, servidor, gratuito, cuota
`;

export async function getActiveTournament(): Promise<DbTournament | null> {
  const rows = await sql<DbTournament[]>`
    select ${TOURNAMENT_COLUMNS}
    from tournament
    where estado in ('inscripciones','en_curso')
    order by created_at desc
    limit 1
  `;
  return rows[0] ?? null;
}

export async function getTournamentById(
  id: string
): Promise<DbTournament | null> {
  const rows = await sql<DbTournament[]>`
    select ${TOURNAMENT_COLUMNS} from tournament where id = ${id} limit 1
  `;
  return rows[0] ?? null;
}

export async function listTournaments(): Promise<DbTournament[]> {
  return sql<DbTournament[]>`
    select ${TOURNAMENT_COLUMNS} from tournament order by created_at desc
  `;
}

export async function setTournamentGratuito(
  id: string,
  gratuito: boolean
): Promise<void> {
  await sql`update tournament set gratuito = ${gratuito} where id = ${id}`;
}

export async function setTournamentCuota(
  id: string,
  cuota: string
): Promise<void> {
  await sql`update tournament set cuota = ${cuota} where id = ${id}`;
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

/* ------------------------- Fase competitiva: grupos y partidos ------------------------- */

export type MatchFormato = "Bo1" | "Bo3" | "Bo5";
export type MatchEstado = "programado" | "en_vivo" | "finalizado";

export interface DbMatch {
  id: string;
  ronda: string;
  formato: MatchFormato;
  groupId: string | null;
  teamAId: string | null;
  teamBId: string | null;
  teamANombre: string | null;
  teamATag: string | null;
  teamBNombre: string | null;
  teamBTag: string | null;
  scoreA: number;
  scoreB: number;
  estado: MatchEstado;
  fecha: string | null;
  orden: number;
}

export interface GroupStanding {
  teamId: string;
  nombre: string;
  tag: string;
  v: number;
  d: number;
  jugados: number;
  difMapas: number;
  clasificado: boolean;
}

export interface GroupWithStandings {
  id: string;
  nombre: string;
  standings: GroupStanding[];
}

const MATCH_COLUMNS = sql`
  m.id, m.ronda, m.formato, m.group_id, m.team_a_id, m.team_b_id,
  ta.nombre as team_a_nombre, ta.tag as team_a_tag,
  tb.nombre as team_b_nombre, tb.tag as team_b_tag,
  m.score_a, m.score_b, m.estado, m.fecha, m.orden
`;

/** Partidos de playoffs (sin grupo) del torneo, con nombres de equipo. */
export async function getBracketMatches(
  tournamentId: string
): Promise<DbMatch[]> {
  return sql<DbMatch[]>`
    select ${MATCH_COLUMNS}
    from tournament_match m
    left join team ta on ta.id = m.team_a_id
    left join team tb on tb.id = m.team_b_id
    where m.tournament_id = ${tournamentId} and m.group_id is null
    order by m.orden asc, m.created_at asc
  `;
}

/** Grupos con tabla de posiciones calculada desde los partidos finalizados. */
export async function getGroupsWithStandings(
  tournamentId: string
): Promise<GroupWithStandings[]> {
  const groups = await sql<{ id: string; nombre: string }[]>`
    select id, nombre from tournament_group
    where tournament_id = ${tournamentId}
    order by orden asc, nombre asc
  `;
  if (groups.length === 0) return [];

  const members = await sql<
    { groupId: string; teamId: string; nombre: string; tag: string }[]
  >`
    select gt.group_id, gt.team_id, t.nombre, t.tag
    from tournament_group_team gt
    join team t on t.id = gt.team_id
    where gt.group_id in ${sql(groups.map((g) => g.id))}
  `;

  const matches = await sql<
    {
      groupId: string;
      teamAId: string | null;
      teamBId: string | null;
      scoreA: number;
      scoreB: number;
    }[]
  >`
    select group_id, team_a_id, team_b_id, score_a, score_b
    from tournament_match
    where tournament_id = ${tournamentId}
      and group_id is not null
      and estado = 'finalizado'
  `;

  return groups.map((g) => {
    const tally = new Map<string, GroupStanding>();
    for (const m of members.filter((x) => x.groupId === g.id)) {
      tally.set(m.teamId, {
        teamId: m.teamId,
        nombre: m.nombre,
        tag: m.tag,
        v: 0,
        d: 0,
        jugados: 0,
        difMapas: 0,
        clasificado: false,
      });
    }
    for (const mt of matches.filter((x) => x.groupId === g.id)) {
      const a = mt.teamAId ? tally.get(mt.teamAId) : undefined;
      const b = mt.teamBId ? tally.get(mt.teamBId) : undefined;
      if (a) {
        a.jugados++;
        a.difMapas += mt.scoreA - mt.scoreB;
        if (mt.scoreA > mt.scoreB) a.v++;
        else a.d++;
      }
      if (b) {
        b.jugados++;
        b.difMapas += mt.scoreB - mt.scoreA;
        if (mt.scoreB > mt.scoreA) b.v++;
        else b.d++;
      }
    }
    const standings = [...tally.values()].sort(
      (x, y) => y.v - x.v || y.difMapas - x.difMapas || x.nombre.localeCompare(y.nombre)
    );
    standings.forEach((s, i) => {
      s.clasificado = i < 2 && s.jugados > 0;
    });
    return { id: g.id, nombre: g.nombre, standings };
  });
}

export interface GroupWithTeams {
  id: string;
  nombre: string;
  orden: number;
  teams: { id: string; nombre: string; tag: string }[];
}

/** Grupos con sus equipos (para gestión del CO, sin standings). */
export async function getGroupsWithTeams(
  tournamentId: string
): Promise<GroupWithTeams[]> {
  const groups = await sql<{ id: string; nombre: string; orden: number }[]>`
    select id, nombre, orden from tournament_group
    where tournament_id = ${tournamentId}
    order by orden asc, nombre asc
  `;
  if (groups.length === 0) return [];
  const members = await sql<
    { groupId: string; id: string; nombre: string; tag: string }[]
  >`
    select gt.group_id, t.id, t.nombre, t.tag
    from tournament_group_team gt
    join team t on t.id = gt.team_id
    where gt.group_id in ${sql(groups.map((g) => g.id))}
    order by t.nombre asc
  `;
  return groups.map((g) => ({
    ...g,
    teams: members
      .filter((m) => m.groupId === g.id)
      .map((m) => ({ id: m.id, nombre: m.nombre, tag: m.tag })),
  }));
}

/** Todos los partidos del torneo (grupos y playoffs) con nombres de equipo. */
export async function getAllMatches(tournamentId: string): Promise<DbMatch[]> {
  return sql<DbMatch[]>`
    select ${MATCH_COLUMNS}
    from tournament_match m
    left join team ta on ta.id = m.team_a_id
    left join team tb on tb.id = m.team_b_id
    where m.tournament_id = ${tournamentId}
    order by (m.group_id is null) asc, m.orden asc, m.created_at asc
  `;
}

export async function deleteMatch(matchId: string): Promise<void> {
  await sql`delete from tournament_match where id = ${matchId}`;
}

export async function removeGroupTeam(
  groupId: string,
  teamId: string
): Promise<void> {
  await sql`delete from tournament_group_team where group_id = ${groupId} and team_id = ${teamId}`;
}

/* ------------------------- Ranking Nacional (Art. 43) ------------------------- */

export interface RankingStanding {
  teamId: string;
  nombre: string;
  tag: string;
  rama: Rama;
  series: number;
  mapas: number;
  difMapas: number;
  bonusPosicion: number;
  ajustes: number;
  puntos: number;
}

export interface DbRankingAdjustment {
  id: string;
  teamId: string;
  teamNombre: string;
  teamTag: string;
  puntos: number;
  motivo: string;
  createdAt: string;
}

/**
 * Calcula el ranking acumulado desde los partidos finalizados de TODOS los
 * torneos (ventana de 12 meses del Art. 43) + ajustes manuales del CO.
 * Puntos: serie ganada +20 · mapa ganado +8 · Gran Final ganada +400 /
 * perdida +260 · Semifinal perdida +160 · ajustes (±).
 */
export async function getRankingStandings(): Promise<RankingStanding[]> {
  const teams = await sql<
    { id: string; nombre: string; tag: string; rama: Rama }[]
  >`
    select id, nombre, tag, rama from team where estado != 'rechazado'
  `;

  const matches = await sql<
    {
      ronda: string;
      teamAId: string | null;
      teamBId: string | null;
      scoreA: number;
      scoreB: number;
    }[]
  >`
    select ronda, team_a_id, team_b_id, score_a, score_b
    from tournament_match
    where estado = 'finalizado'
      and created_at > now() - interval '12 months'
  `;

  const adjustments = await sql<{ teamId: string; puntos: number }[]>`
    select team_id, puntos from ranking_adjustment
    where created_at > now() - interval '12 months'
  `;

  const tally = new Map<string, RankingStanding>();
  for (const t of teams) {
    tally.set(t.id, {
      teamId: t.id,
      nombre: t.nombre,
      tag: t.tag,
      rama: t.rama,
      series: 0,
      mapas: 0,
      difMapas: 0,
      bonusPosicion: 0,
      ajustes: 0,
      puntos: 0,
    });
  }

  const norm = (s: string) =>
    s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  const jugaron = new Set<string>();
  for (const m of matches) {
    const a = m.teamAId ? tally.get(m.teamAId) : undefined;
    const b = m.teamBId ? tally.get(m.teamBId) : undefined;
    if (!a && !b) continue;
    if (a) jugaron.add(a.teamId);
    if (b) jugaron.add(b.teamId);
    const aWon = m.scoreA > m.scoreB;
    if (a) {
      a.mapas += m.scoreA;
      a.difMapas += m.scoreA - m.scoreB;
      if (aWon) a.series++;
    }
    if (b) {
      b.mapas += m.scoreB;
      b.difMapas += m.scoreB - m.scoreA;
      if (!aWon) b.series++;
    }
    const ronda = norm(m.ronda);
    const winner = aWon ? a : b;
    const loser = aWon ? b : a;
    if (ronda.includes("gran final") || ronda === "final") {
      if (winner) winner.bonusPosicion += 400;
      if (loser) loser.bonusPosicion += 260;
    } else if (ronda.includes("semifinal") || ronda.includes("semis")) {
      if (loser) loser.bonusPosicion += 160;
    }
  }

  for (const adj of adjustments) {
    const t = tally.get(adj.teamId);
    if (t) t.ajustes += adj.puntos;
  }

  const rows = [...tally.values()];
  for (const r of rows) {
    r.puntos = r.series * 20 + r.mapas * 8 + r.bonusPosicion + r.ajustes;
  }

  return rows
    .filter((r) => jugaron.has(r.teamId) || r.ajustes !== 0)
    .sort(
      (x, y) =>
        y.puntos - x.puntos ||
        y.series - x.series ||
        y.difMapas - x.difMapas ||
        x.nombre.localeCompare(y.nombre)
    );
}

export async function listRankingAdjustments(): Promise<DbRankingAdjustment[]> {
  return sql<DbRankingAdjustment[]>`
    select ra.id, ra.team_id, t.nombre as team_nombre, t.tag as team_tag,
           ra.puntos, ra.motivo, ra.created_at
    from ranking_adjustment ra
    join team t on t.id = ra.team_id
    order by ra.created_at desc
  `;
}

export async function createRankingAdjustment(
  teamId: string,
  puntos: number,
  motivo: string
): Promise<void> {
  await sql`
    insert into ranking_adjustment (team_id, puntos, motivo)
    values (${teamId}, ${puntos}, ${motivo})
  `;
}

export async function deleteRankingAdjustment(id: string): Promise<void> {
  await sql`delete from ranking_adjustment where id = ${id}`;
}

/* --- Escritura (para el panel del CO) --- */

export async function createGroup(
  tournamentId: string,
  nombre: string,
  orden = 0
): Promise<string> {
  const [row] = await sql<{ id: string }[]>`
    insert into tournament_group (tournament_id, nombre, orden)
    values (${tournamentId}, ${nombre}, ${orden})
    returning id
  `;
  return row.id;
}

export async function addGroupTeam(
  groupId: string,
  teamId: string
): Promise<void> {
  await sql`
    insert into tournament_group_team (group_id, team_id)
    values (${groupId}, ${teamId})
    on conflict do nothing
  `;
}

export async function createMatch(input: {
  tournamentId: string;
  groupId: string | null;
  ronda: string;
  formato: MatchFormato;
  teamAId: string | null;
  teamBId: string | null;
  fecha?: string | null;
  orden?: number;
}): Promise<string> {
  const [row] = await sql<{ id: string }[]>`
    insert into tournament_match
      (tournament_id, group_id, ronda, formato, team_a_id, team_b_id, fecha, orden)
    values
      (${input.tournamentId}, ${input.groupId}, ${input.ronda}, ${input.formato},
       ${input.teamAId}, ${input.teamBId}, ${input.fecha ?? null}, ${input.orden ?? 0})
    returning id
  `;
  return row.id;
}

export async function setMatchResult(
  matchId: string,
  scoreA: number,
  scoreB: number,
  estado: MatchEstado
): Promise<void> {
  await sql`
    update tournament_match
    set score_a = ${scoreA}, score_b = ${scoreB}, estado = ${estado}
    where id = ${matchId}
  `;
}
