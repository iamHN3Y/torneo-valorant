import { sql } from "./db";
import type { RankId, Rol, Rama, EstadoInscripcion } from "./types";

/* ------------------------------ Tipos ------------------------------ */

export interface DbCoUser {
  id: string;
  username: string;
  passwordHash: string;
  nombre: string;
}

// Re-exportado desde ./teamAccent (módulo sin dependencias de BD) para que
// los componentes cliente puedan importar la paleta sin arrastrar `postgres`
// al bundle del navegador. Ver lib/teamAccent.ts.
export { TEAM_ACCENTS, TEAM_ACCENT_HEX, type TeamAccent } from "./teamAccent";

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
  accent: string;
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
  sorteoPublicadoAt: string | null;
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
           roster_locked, nota_co, created_at, accent, password_hash
    from team
    where lower(nombre) = lower(${nombre}) and lower(tag) = lower(${tag})
    limit 1
  `;
  return rows[0] ?? null;
}

export async function getTeamById(id: string): Promise<DbTeam | null> {
  const rows = await sql<DbTeam[]>`
    select id, tournament_id, nombre, tag, rama, estado, orden_inscripcion,
           roster_locked, nota_co, created_at, accent
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
             roster_locked, nota_co, created_at, accent
      from team where tournament_id = ${tournamentId}
      order by orden_inscripcion asc nulls last, created_at asc
    `;
  }
  return sql<DbTeam[]>`
    select id, tournament_id, nombre, tag, rama, estado, orden_inscripcion,
           roster_locked, nota_co, created_at, accent
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
  id, nombre, edicion, temporada, estado, cupo_max, servidor, gratuito, cuota,
  sorteo_publicado_at as "sorteoPublicadoAt"
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

/** Último torneo finalizado (para mostrar campeón/resultados aun sin torneo activo). */
export async function getLastFinishedTournament(): Promise<DbTournament | null> {
  const rows = await sql<DbTournament[]>`
    select ${TOURNAMENT_COLUMNS}
    from tournament
    where estado = 'finalizado'
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

/**
 * Publica el sorteo de grupos: revela la asignación real de equipos a
 * grupos en las vistas públicas (Fase 6). Requiere al menos un grupo con al
 * menos un equipo asignado. Es de una sola vez: si ya estaba publicado, no
 * reinicia `sorteo_publicado_at` (evita que republicar mueva el "momento"
 * del sorteo).
 */
export async function publishSorteo(
  tournamentId: string
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const [{ count }] = await sql<{ count: number }[]>`
    select count(*)::int as count
    from tournament_group_team gt
    join tournament_group g on g.id = gt.group_id
    where g.tournament_id = ${tournamentId}
  `;
  if (count === 0) {
    return { ok: false, reason: "No hay grupos con equipos para publicar." };
  }

  const result = await sql`
    update tournament
    set sorteo_publicado_at = now()
    where id = ${tournamentId} and sorteo_publicado_at is null
  `;
  if (result.count === 0) {
    return { ok: false, reason: "El sorteo ya fue publicado." };
  }
  return { ok: true };
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

/** Cambia el acento de color del equipo (Fase 5). El CHECK de la BD ya
 *  restringe los valores válidos, pero la Server Action que llama a esto
 *  debe validar contra `TEAM_ACCENTS` antes (defensa en profundidad). */
export async function setTeamAccent(teamId: string, accent: string): Promise<void> {
  await sql`update team set accent = ${accent} where id = ${teamId}`;
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
  teamAAccent: string | null;
  teamBNombre: string | null;
  teamBTag: string | null;
  teamBAccent: string | null;
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
  accent: string;
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
  ta.nombre as team_a_nombre, ta.tag as team_a_tag, ta.accent as team_a_accent,
  tb.nombre as team_b_nombre, tb.tag as team_b_tag, tb.accent as team_b_accent,
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
    { groupId: string; teamId: string; nombre: string; tag: string; accent: string }[]
  >`
    select gt.group_id, gt.team_id, t.nombre, t.tag, t.accent
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
        accent: m.accent,
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

/* ------------------------- Home: señal en vivo del torneo ------------------------- */

export interface HomeSignal {
  inscritos: number;
  equipos: { nombre: string; tag: string }[];
  liveMatch: DbMatch | null;
  nextMatch: DbMatch | null;
}

/**
 * Datos para el hero dinámico de la Home: cupos ocupados, equipos inscritos
 * (para el Marquee, excluye rechazados), el partido en vivo (si lo hay) y el
 * próximo partido programado.
 */
export async function getHomeSignal(tournamentId: string): Promise<HomeSignal> {
  const [inscritos, equipos, liveRows, nextRows] = await Promise.all([
    countTeamsOccupyingSlot(tournamentId),
    sql<{ nombre: string; tag: string }[]>`
      select nombre, tag
      from team
      where tournament_id = ${tournamentId} and estado != 'rechazado'
      order by orden_inscripcion asc nulls last, created_at asc
    `,
    // Gating del sorteo (Fase 6): un partido de fase de grupos (group_id no
    // nulo) de un torneo que aún no publicó el sorteo NUNCA es candidato a
    // "en vivo"/"próximo" destacado en la Home — se salta directamente en el
    // WHERE, no se proyecta con placeholder (a diferencia de getPublicMatch,
    // aquí se elige entre varios candidatos, así que simplemente se excluye).
    sql<DbMatch[]>`
      select ${MATCH_COLUMNS}
      from tournament_match m
      join tournament t on t.id = m.tournament_id
      left join team ta on ta.id = m.team_a_id
      left join team tb on tb.id = m.team_b_id
      where m.tournament_id = ${tournamentId} and m.estado = 'en_vivo'
        and (m.group_id is null or t.sorteo_publicado_at is not null)
      order by m.orden asc, m.created_at asc
      limit 1
    `,
    sql<DbMatch[]>`
      select ${MATCH_COLUMNS}
      from tournament_match m
      join tournament t on t.id = m.tournament_id
      left join team ta on ta.id = m.team_a_id
      left join team tb on tb.id = m.team_b_id
      where m.tournament_id = ${tournamentId} and m.estado = 'programado'
        and (m.group_id is null or t.sorteo_publicado_at is not null)
      order by m.fecha asc nulls last, m.orden asc, m.created_at asc
      limit 1
    `,
  ]);
  return {
    inscritos,
    equipos,
    liveMatch: liveRows[0] ?? null,
    nextMatch: nextRows[0] ?? null,
  };
}

/** Próximo partido (en vivo o programado) de un equipo, con nombre/tag del rival.
 *  Gating del sorteo (Fase 6): igual que en getHomeSignal, un partido de fase
 *  de grupos de un torneo sin sorteo publicado nunca se devuelve, aunque el
 *  equipo esté logueado (no se le revela el rival antes de tiempo). */
export async function getNextMatchForTeam(teamId: string): Promise<DbMatch | null> {
  const rows = await sql<DbMatch[]>`
    select ${MATCH_COLUMNS}
    from tournament_match m
    join tournament t on t.id = m.tournament_id
    left join team ta on ta.id = m.team_a_id
    left join team tb on tb.id = m.team_b_id
    where (m.team_a_id = ${teamId} or m.team_b_id = ${teamId})
      and m.estado in ('programado', 'en_vivo')
      and (m.group_id is null or t.sorteo_publicado_at is not null)
    order by (m.estado = 'en_vivo') desc, m.fecha asc nulls last, m.orden asc, m.created_at asc
    limit 1
  `;
  return rows[0] ?? null;
}

export async function deleteMatch(matchId: string): Promise<void> {
  await sql`delete from tournament_match where id = ${matchId}`;
}

/** Resumen barato de un partido (para descripciones de auditoría). */
export async function getMatchSummary(matchId: string): Promise<{
  id: string;
  ronda: string;
  teamANombre: string | null;
  teamBNombre: string | null;
} | null> {
  const rows = await sql<
    { id: string; ronda: string; teamANombre: string | null; teamBNombre: string | null }[]
  >`
    select m.id, m.ronda, ta.nombre as "teamANombre", tb.nombre as "teamBNombre"
    from tournament_match m
    left join team ta on ta.id = m.team_a_id
    left join team tb on tb.id = m.team_b_id
    where m.id = ${matchId}
    limit 1
  `;
  return rows[0] ?? null;
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
  accent: string;
  rama: Rama;
  series: number;
  mapas: number;
  difMapas: number;
  bonusPosicion: number;
  ajustes: number;
  puntos: number;
  /** Puntos acumulados en hasta 8 cortes cronológicos recientes (Art. 43). */
  historial: number[];
  /** Diferencia de puntos entre el corte más reciente y el anterior. */
  delta: number;
}

/** Tope fijo de cortes temporales que expone el historial del ranking. */
const HISTORIAL_MAX_CORTES = 8;

/**
 * Un evento de puntuación con marca de tiempo real (no `created_at` de la
 * fila). `ts` es `Date`: postgres.js deserializa las columnas timestamptz
 * como `Date`, no como `string` — tiparlo como `Date` evita que un futuro
 * refactor (p. ej. cambiar a `.localeCompare()` asumiendo string) rompa el
 * orden cronológico en silencio.
 */
interface RankingEvent {
  ts: Date;
  delta: number;
}

/**
 * Reduce una secuencia cronológica de eventos de puntuación a un historial
 * acumulado de como máximo `HISTORIAL_MAX_CORTES` cortes: si hay pocos
 * eventos, un corte por evento; si hay más, se muestrean en buckets
 * uniformes (el último evento de cada bucket) para no crecer sin límite.
 */
function buildHistorial(events: RankingEvent[]): number[] {
  const sorted = [...events].sort((a, b) => a.ts.getTime() - b.ts.getTime());
  const cumulative: number[] = [];
  let running = 0;
  for (const e of sorted) {
    running += e.delta;
    cumulative.push(running);
  }
  if (cumulative.length <= HISTORIAL_MAX_CORTES) return cumulative;

  // Muestreo en HISTORIAL_MAX_CORTES buckets uniformes, quedándonos con el
  // último valor acumulado de cada bucket (el corte de cierre de esa ventana).
  const out: number[] = [];
  for (let i = 1; i <= HISTORIAL_MAX_CORTES; i++) {
    const idx = Math.floor((i * cumulative.length) / HISTORIAL_MAX_CORTES) - 1;
    out.push(cumulative[idx]);
  }
  return out;
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
    { id: string; nombre: string; tag: string; accent: string; rama: Rama }[]
  >`
    select id, nombre, tag, accent, rama from team where estado != 'rechazado'
  `;

  const matches = await sql<
    {
      ts: Date;
      ronda: string;
      teamAId: string | null;
      teamBId: string | null;
      scoreA: number;
      scoreB: number;
    }[]
  >`
    select coalesce(finalizado_at, fecha, created_at) as ts,
           ronda, team_a_id, team_b_id, score_a, score_b
    from tournament_match
    where estado = 'finalizado'
      and coalesce(finalizado_at, fecha, created_at) > now() - interval '12 months'
  `;

  const adjustments = await sql<
    { teamId: string; puntos: number; ts: Date }[]
  >`
    select team_id, puntos, created_at as ts from ranking_adjustment
    where created_at > now() - interval '12 months'
  `;

  const tally = new Map<string, RankingStanding>();
  for (const t of teams) {
    tally.set(t.id, {
      teamId: t.id,
      nombre: t.nombre,
      tag: t.tag,
      accent: t.accent,
      rama: t.rama,
      series: 0,
      mapas: 0,
      difMapas: 0,
      bonusPosicion: 0,
      ajustes: 0,
      puntos: 0,
      historial: [],
      delta: 0,
    });
  }

  const norm = (s: string) =>
    s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  // Eventos de puntuación por equipo, con la marca de tiempo real del hecho
  // que los origina (partido jugado o ajuste del CO), para construir el
  // historial/delta sin depender de `created_at` de la fila.
  const events = new Map<string, RankingEvent[]>();
  const pushEvent = (teamId: string, ts: Date, delta: number) => {
    if (delta === 0) return;
    const list = events.get(teamId);
    if (list) list.push({ ts, delta });
    else events.set(teamId, [{ ts, delta }]);
  };

  const jugaron = new Set<string>();
  for (const m of matches) {
    const a = m.teamAId ? tally.get(m.teamAId) : undefined;
    const b = m.teamBId ? tally.get(m.teamBId) : undefined;
    if (!a && !b) continue;
    if (a) jugaron.add(a.teamId);
    if (b) jugaron.add(b.teamId);
    const aWon = m.scoreA > m.scoreB;
    let deltaA = 0;
    let deltaB = 0;
    if (a) {
      a.mapas += m.scoreA;
      a.difMapas += m.scoreA - m.scoreB;
      if (aWon) a.series++;
      deltaA += (aWon ? 20 : 0) + m.scoreA * 8;
    }
    if (b) {
      b.mapas += m.scoreB;
      b.difMapas += m.scoreB - m.scoreA;
      if (!aWon) b.series++;
      deltaB += (!aWon ? 20 : 0) + m.scoreB * 8;
    }
    const ronda = norm(m.ronda);
    const winner = aWon ? a : b;
    const loser = aWon ? b : a;
    if (ronda.includes("gran final") || ronda === "final") {
      if (winner) {
        winner.bonusPosicion += 400;
        if (winner === a) deltaA += 400;
        else deltaB += 400;
      }
      if (loser) {
        loser.bonusPosicion += 260;
        if (loser === a) deltaA += 260;
        else deltaB += 260;
      }
    } else if (ronda.includes("semifinal") || ronda.includes("semis")) {
      if (loser) {
        loser.bonusPosicion += 160;
        if (loser === a) deltaA += 160;
        else deltaB += 160;
      }
    }
    if (a) pushEvent(a.teamId, m.ts, deltaA);
    if (b) pushEvent(b.teamId, m.ts, deltaB);
  }

  for (const adj of adjustments) {
    const t = tally.get(adj.teamId);
    if (t) t.ajustes += adj.puntos;
    pushEvent(adj.teamId, adj.ts, adj.puntos);
  }

  const rows = [...tally.values()];
  for (const r of rows) {
    r.puntos = r.series * 20 + r.mapas * 8 + r.bonusPosicion + r.ajustes;
    const historial = buildHistorial(events.get(r.teamId) ?? []);
    r.historial = historial;
    r.delta =
      historial.length >= 2
        ? historial[historial.length - 1] - historial[historial.length - 2]
        : 0;
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

/**
 * Actualiza marcador/estado en una sola sentencia UPDATE atómica: el nuevo
 * finalizado_at se calcula con un CASE sobre el estado ya almacenado en la
 * misma fila (lectura y escritura atómicas), evitando la condición de
 * carrera de un read-then-update en dos sentencias (O3).
 */
export async function setMatchResult(
  matchId: string,
  scoreA: number,
  scoreB: number,
  estado: MatchEstado
): Promise<void> {
  await sql`
    update tournament_match
    set score_a = ${scoreA},
        score_b = ${scoreB},
        estado = ${estado},
        finalizado_at = case
          when estado <> 'finalizado' and ${estado} = 'finalizado' then now()
          when ${estado} <> 'finalizado' then null
          else finalizado_at
        end
    where id = ${matchId}
  `;
}

/* ------------------------- Auditoría del CO (Fase 3) ------------------------- */

export type AuditTipo =
  | "match_result"
  | "match_delete"
  | "match_create"
  | "team_estado"
  | "roster_lock"
  | "team_nota"
  | "adjustment_create"
  | "adjustment_delete"
  | "revert"
  | "tournament_create"
  | "tournament_estado"
  | "tournament_gratuito"
  | "tournament_cuota"
  | "group_create"
  | "group_team_add"
  | "group_team_remove"
  | "sorteo_publish";

export interface DbAuditEntry {
  id: string;
  coUserId: string;
  coNombre: string | null;
  tipo: AuditTipo;
  entidadId: string | null;
  revierteAuditId: string | null;
  beforeData: unknown;
  afterData: unknown;
  descripcion: string;
  createdAt: string;
}

/** Inserta una entrada de auditoría (append-only) y devuelve su id. */
export async function writeAudit(input: {
  coUserId: string;
  tipo: AuditTipo;
  entidadId?: string | null;
  revierteAuditId?: string | null;
  before?: unknown;
  after?: unknown;
  descripcion: string;
}): Promise<string> {
  const [row] = await sql<{ id: string }[]>`
    insert into audit_log
      (co_user_id, tipo, entidad_id, revierte_audit_id, before_data, after_data, descripcion)
    values (
      ${input.coUserId},
      ${input.tipo},
      ${input.entidadId ?? null},
      ${input.revierteAuditId ?? null},
      ${input.before === undefined ? null : sql.json(input.before as never)},
      ${input.after === undefined ? null : sql.json(input.after as never)},
      ${input.descripcion}
    )
    returning id
  `;
  return row.id;
}

/** Últimas entradas de auditoría, con el nombre del autor (CO). */
export async function listAudit(limit = 50): Promise<DbAuditEntry[]> {
  return sql<DbAuditEntry[]>`
    select al.id, al.co_user_id, cu.nombre as co_nombre, al.tipo, al.entidad_id,
           al.revierte_audit_id, al.before_data, al.after_data, al.descripcion,
           al.created_at
    from audit_log al
    left join co_user cu on cu.id = al.co_user_id
    order by al.created_at desc
    limit ${limit}
  `;
}

export interface MatchCoreState {
  id: string;
  scoreA: number;
  scoreB: number;
  estado: MatchEstado;
}

/** Estado actual completo (mínimo) de un partido, para comparar antes de revertir. */
export async function getMatchForRevert(
  matchId: string
): Promise<MatchCoreState | null> {
  const rows = await sql<MatchCoreState[]>`
    select id, score_a as "scoreA", score_b as "scoreB", estado
    from tournament_match
    where id = ${matchId}
    limit 1
  `;
  return rows[0] ?? null;
}

/**
 * Revierte el resultado de un partido a partir de una entrada de auditoría
 * `match_result`, con concurrencia optimista: solo aplica el `before_data`
 * si el estado actual del partido coincide exactamente con el `after_data`
 * que guardó esa entrada (si alguien más lo modificó después, se rechaza).
 */
export async function revertMatchResult(
  auditId: string,
  coUserId: string
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const [entry] = await sql<
    {
      id: string;
      tipo: AuditTipo;
      entidadId: string | null;
      beforeData: { scoreA: number; scoreB: number; estado: MatchEstado } | null;
      afterData: { scoreA: number; scoreB: number; estado: MatchEstado } | null;
    }[]
  >`
    select id, tipo, entidad_id, before_data, after_data
    from audit_log
    where id = ${auditId}
    limit 1
  `;
  if (!entry || entry.tipo !== "match_result" || !entry.entidadId) {
    return { ok: false, reason: "La entrada de auditoría no es válida." };
  }
  if (!entry.beforeData || !entry.afterData) {
    return { ok: false, reason: "No hay datos suficientes para deshacer." };
  }

  const current = await getMatchForRevert(entry.entidadId);
  if (!current) {
    return { ok: false, reason: "El partido ya no existe." };
  }
  const after = entry.afterData;
  if (
    current.scoreA !== after.scoreA ||
    current.scoreB !== after.scoreB ||
    current.estado !== after.estado
  ) {
    return { ok: false, reason: "El resultado cambió desde entonces." };
  }

  const before = entry.beforeData;
  const wasFinalizado = current.estado === "finalizado";
  const willBeFinalizado = before.estado === "finalizado";
  const finalizadoAtExpr = willBeFinalizado
    ? wasFinalizado
      ? sql`finalizado_at`
      : sql`now()`
    : sql`null`;

  const result = await sql`
    update tournament_match
    set score_a = ${before.scoreA}, score_b = ${before.scoreB}, estado = ${before.estado},
        finalizado_at = ${finalizadoAtExpr}
    where id = ${entry.entidadId}
      and score_a = ${after.scoreA} and score_b = ${after.scoreB} and estado = ${after.estado}
  `;
  if (result.count === 0) {
    return { ok: false, reason: "El resultado cambió desde entonces." };
  }

  // El revert en tournament_match ya tuvo éxito arriba; un fallo al auditar
  // no debe hacer que la acción reporte error al usuario (O1).
  try {
    await writeAudit({
      coUserId,
      tipo: "revert",
      entidadId: entry.entidadId,
      revierteAuditId: entry.id,
      before: after,
      after: before,
      descripcion: `Deshecho resultado de partido (revierte auditoría ${entry.id.slice(0, 8)})`,
    });
  } catch (err) {
    console.error("[audit_log] no se pudo escribir la entrada de auditoría (revert)", err);
  }

  return { ok: true };
}

/**
 * Proyección pública y cerrada de un partido para /marcador/[matchId]:
 * SOLO ronda, formato, marcador, estado, fecha y nombre/tag de equipos.
 * Nunca expone nota_co, password_hash, roster_locked, orden_inscripcion,
 * riot_id ni nacionalidad. Devuelve null si no existe o si el torneo está
 * en 'borrador'.
 */
export interface PublicMatch {
  ronda: string;
  formato: MatchFormato;
  scoreA: number;
  scoreB: number;
  estado: MatchEstado;
  fecha: string | null;
  teamANombre: string | null;
  teamATag: string | null;
  teamBNombre: string | null;
  teamBTag: string | null;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getPublicMatch(matchId: string): Promise<PublicMatch | null> {
  if (!UUID_RE.test(matchId)) return null;
  const rows = await sql<
    (PublicMatch & { groupId: string | null; sorteoPublicadoAt: string | null })[]
  >`
    select m.ronda, m.formato, m.score_a as "scoreA", m.score_b as "scoreB",
           m.estado, m.fecha, m.group_id as "groupId",
           t.sorteo_publicado_at as "sorteoPublicadoAt",
           ta.nombre as "teamANombre", ta.tag as "teamATag",
           tb.nombre as "teamBNombre", tb.tag as "teamBTag"
    from tournament_match m
    join tournament t on t.id = m.tournament_id
    left join team ta on ta.id = m.team_a_id
    left join team tb on tb.id = m.team_b_id
    where m.id = ${matchId} and t.estado != 'borrador'
    limit 1
  `;
  const row = rows[0];
  if (!row) return null;

  // Gating del sorteo (Fase 6): mientras el torneo no haya publicado el
  // sorteo, los partidos de fase de grupos no revelan qué equipos juegan.
  // Los partidos sin grupo (playoffs) no están afectados.
  if (row.groupId && !row.sorteoPublicadoAt) {
    return {
      ronda: row.ronda,
      formato: row.formato,
      scoreA: row.scoreA,
      scoreB: row.scoreB,
      estado: row.estado,
      fecha: row.fecha,
      teamANombre: "Por anunciar",
      teamATag: null,
      teamBNombre: "Por anunciar",
      teamBTag: null,
    };
  }

  const { groupId: _groupId, sorteoPublicadoAt: _sorteo, ...publicMatch } = row;
  return publicMatch;
}
