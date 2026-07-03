import type { Team, Match, GroupRow } from "./types";

/** Configuración del torneo — los campos "por definir" del reglamento van aquí. */
export const TOURNAMENT = {
  nombre: "Copa México VALORANT 2026",
  edicion: "Edición I",
  version: "v1.3",
  temporada: "2026",
  cupoMax: 64,
  inscritos: 23, // demo
  cuota: "Por definir",
  bolsa: "Por definir",
  servidor: "LATAM-N / México",
  inicioInscripciones: "Por definir",
};

/** Equipos de ejemplo para la demo. */
export const TEAMS: Team[] = [
  {
    id: "t1",
    nombre: "Jaguares Esports",
    tag: "JAG",
    rama: "elite",
    estado: "aprobado",
    puntos: 58,
    ordenInscripcion: 1,
    fechaRegistro: "2026-06-12",
    jugadores: [],
  },
  {
    id: "t2",
    nombre: "Aztlán Gaming",
    tag: "AZT",
    rama: "elite",
    estado: "aprobado",
    puntos: 49,
    ordenInscripcion: 2,
    fechaRegistro: "2026-06-12",
    jugadores: [],
  },
  {
    id: "t3",
    nombre: "Cempoala Five",
    tag: "CMP",
    rama: "amateur",
    estado: "en_revision",
    puntos: 28,
    ordenInscripcion: 3,
    fechaRegistro: "2026-06-13",
    jugadores: [],
  },
  {
    id: "t4",
    nombre: "Quetzal Squad",
    tag: "QTZ",
    rama: "amateur",
    estado: "aprobado",
    puntos: 26,
    ordenInscripcion: 4,
    fechaRegistro: "2026-06-13",
    jugadores: [],
  },
  {
    id: "t5",
    nombre: "Norte Wolves",
    tag: "NWV",
    rama: "elite",
    estado: "pendiente_pago",
    puntos: 52,
    ordenInscripcion: 5,
    fechaRegistro: "2026-06-14",
    jugadores: [],
  },
  {
    id: "t6",
    nombre: "Pacífico Reapers",
    tag: "PCR",
    rama: "amateur",
    estado: "aprobado",
    puntos: 22,
    ordenInscripcion: 6,
    fechaRegistro: "2026-06-14",
    jugadores: [],
  },
  {
    id: "t7",
    nombre: "Bajío Titans",
    tag: "BJT",
    rama: "elite",
    estado: "en_revision",
    puntos: 45,
    ordenInscripcion: 7,
    fechaRegistro: "2026-06-15",
    jugadores: [],
  },
  {
    id: "t8",
    nombre: "Capital Royals",
    tag: "CPR",
    rama: "amateur",
    estado: "lista_espera",
    puntos: 30,
    ordenInscripcion: 8,
    fechaRegistro: "2026-06-15",
    jugadores: [],
  },
];

/** Tabla de un grupo (formato GSL) para la vista de competición. */
export const GROUP_A: GroupRow[] = [
  { pos: 1, nombre: "Jaguares Esports", tag: "JAG", v: 2, d: 0, difMapas: 4, clasificado: true },
  { pos: 2, nombre: "Quetzal Squad", tag: "QTZ", v: 2, d: 1, difMapas: 1, clasificado: true },
  { pos: 3, nombre: "Bajío Titans", tag: "BJT", v: 1, d: 2, difMapas: -1, clasificado: false },
  { pos: 4, nombre: "Pacífico Reapers", tag: "PCR", v: 0, d: 2, difMapas: -4, clasificado: false },
];

/** Bracket de playoffs (upper bracket) para la demo. */
export const PLAYOFFS: Record<string, Match[]> = {
  Cuartos: [
    {
      id: "qf1",
      ronda: "Cuartos",
      formato: "Bo3",
      estado: "finalizado",
      a: { nombre: "Jaguares Esports", tag: "JAG", score: 2 },
      b: { nombre: "Pacífico Reapers", tag: "PCR", score: 0 },
      ganador: "a",
    },
    {
      id: "qf2",
      ronda: "Cuartos",
      formato: "Bo3",
      estado: "finalizado",
      a: { nombre: "Aztlán Gaming", tag: "AZT", score: 2 },
      b: { nombre: "Capital Royals", tag: "CPR", score: 1 },
      ganador: "a",
    },
    {
      id: "qf3",
      ronda: "Cuartos",
      formato: "Bo3",
      estado: "en_vivo",
      a: { nombre: "Norte Wolves", tag: "NWV", score: 1 },
      b: { nombre: "Cempoala Five", tag: "CMP", score: 1 },
    },
    {
      id: "qf4",
      ronda: "Cuartos",
      formato: "Bo3",
      estado: "programado",
      a: { nombre: "Bajío Titans", tag: "BJT" },
      b: { nombre: "Quetzal Squad", tag: "QTZ" },
      fecha: "2026-09-20 18:00",
    },
  ],
  Semifinales: [
    {
      id: "sf1",
      ronda: "Semifinales",
      formato: "Bo3",
      estado: "programado",
      a: { nombre: "Jaguares Esports", tag: "JAG" },
      b: { nombre: "Aztlán Gaming", tag: "AZT" },
      fecha: "2026-09-27 18:00",
    },
    {
      id: "sf2",
      ronda: "Semifinales",
      formato: "Bo3",
      estado: "programado",
      a: { nombre: "Por definir", tag: "—" },
      b: { nombre: "Por definir", tag: "—" },
    },
  ],
  "Gran Final": [
    {
      id: "gf",
      ronda: "Gran Final",
      formato: "Bo5",
      estado: "programado",
      a: { nombre: "Por definir", tag: "—" },
      b: { nombre: "Por definir", tag: "—" },
      fecha: "2026-10-04 19:00",
    },
  ],
};

/** Calendario modelo — Anexo A. */
export const CALENDAR = [
  { semana: "Sem. 1–2", titulo: "Inscripciones abiertas", detalle: "Registro de equipos, pago y carga de roster", estado: "activo" },
  { semana: "Sem. 3", titulo: "Verificación y cierre de roster", detalle: "Validación de identidades, tope de puntos y cupos", estado: "proximo" },
  { semana: "Sem. 4–5", titulo: "Clasificatorias abiertas", detalle: "Bo1 con semis y final Bo3 · Determina 32 equipos", estado: "proximo" },
  { semana: "Sem. 6–8", titulo: "Fase de grupos", detalle: "8 grupos de 4 · GSL · Bo3 · Clasifican 16", estado: "proximo" },
  { semana: "Sem. 9–11", titulo: "Playoffs", detalle: "Doble eliminación · Bo3 · Define el Top 4", estado: "proximo" },
  { semana: "Sem. 12", titulo: "Gran Final", detalle: "Bo5 · Transmisión oficial · Premiación", estado: "proximo" },
];

/** Ranking Nacional de Equipos — Art. 43 (acumulado de 12 meses, demo). */
export interface RankingRow {
  pos: number;
  nombre: string;
  tag: string;
  rama: "amateur" | "elite";
  puntos: number;
  delta: number; // movimiento de puestos desde el corte anterior (+ sube)
  series: number; // series ganadas en la ventana
  difMapas: number;
  sanciones: number;
  ultimo: string; // mejor resultado reciente
}

export const RANKING: RankingRow[] = [
  { pos: 1, nombre: "Jaguares Esports", tag: "JAG", rama: "elite", puntos: 720, delta: 0, series: 9, difMapas: 14, sanciones: 0, ultimo: "Campeón" },
  { pos: 2, nombre: "Aztlán Gaming", tag: "AZT", rama: "elite", puntos: 548, delta: 1, series: 7, difMapas: 8, sanciones: 0, ultimo: "Subcampeón" },
  { pos: 3, nombre: "Norte Wolves", tag: "NWV", rama: "elite", puntos: 505, delta: -1, series: 7, difMapas: 6, sanciones: 1, ultimo: "Top 4" },
  { pos: 4, nombre: "Bajío Titans", tag: "BJT", rama: "elite", puntos: 388, delta: 2, series: 5, difMapas: 3, sanciones: 0, ultimo: "Top 4" },
  { pos: 5, nombre: "Quetzal Squad", tag: "QTZ", rama: "amateur", puntos: 274, delta: 0, series: 4, difMapas: 1, sanciones: 0, ultimo: "Top 8" },
  { pos: 6, nombre: "Capital Royals", tag: "CPR", rama: "amateur", puntos: 233, delta: 3, series: 4, difMapas: 0, sanciones: 0, ultimo: "Top 8" },
  { pos: 7, nombre: "Cempoala Five", tag: "CMP", rama: "amateur", puntos: 198, delta: -2, series: 3, difMapas: -1, sanciones: 0, ultimo: "Grupos" },
  { pos: 8, nombre: "Pacífico Reapers", tag: "PCR", rama: "amateur", puntos: 121, delta: -1, series: 2, difMapas: -4, sanciones: 2, ultimo: "Grupos" },
];

/** Tabla de conceptos de puntuación del ranking — Art. 43. */
export const RANKING_CONCEPTS: {
  concepto: string;
  condicion: string;
  puntos: string;
  tipo: "pos" | "acum" | "pen";
}[] = [
  { concepto: "Campeón", condicion: "Gana la Gran Final", puntos: "+400", tipo: "pos" },
  { concepto: "Subcampeón", condicion: "Pierde la Gran Final", puntos: "+260", tipo: "pos" },
  { concepto: "Top 4", condicion: "Semifinales o final de lower", puntos: "+160", tipo: "pos" },
  { concepto: "Top 8", condicion: "Alcanza playoffs", puntos: "+90", tipo: "pos" },
  { concepto: "Clasifica a grupos", condicion: "Supera clasificatorias", puntos: "+45", tipo: "pos" },
  { concepto: "Victoria de serie", condicion: "Bo1, Bo3 o Bo5 ganado", puntos: "+20", tipo: "acum" },
  { concepto: "Victoria de mapa", condicion: "Mapa ganado en serie oficial", puntos: "+8", tipo: "acum" },
  { concepto: "Victoria vs rival superior", condicion: "Vence a equipo 5+ puestos arriba", puntos: "+15", tipo: "acum" },
  { concepto: "Consistencia", condicion: "Sin W.O. y series completas", puntos: "+25", tipo: "acum" },
  { concepto: "Penalización por W.O.", condicion: "Incomparecencia o abandono", puntos: "−40", tipo: "pen" },
  { concepto: "Penalización disciplinaria", condicion: "Falta grave o muy grave", puntos: "−75 a −250", tipo: "pen" },
];

export const ESTADO_LABEL: Record<string, { label: string; color: string }> = {
  borrador: { label: "Borrador", color: "text-muted" },
  pendiente_pago: { label: "Pendiente de pago", color: "text-gold" },
  en_revision: { label: "En revisión", color: "text-teal" },
  aprobado: { label: "Aprobado", color: "text-teal" },
  rechazado: { label: "Rechazado", color: "text-brand" },
  lista_espera: { label: "Lista de espera", color: "text-muted" },
};
