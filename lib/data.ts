/**
 * Configuración estática del torneo.
 * Los datos vivos (equipos, partidos, ranking) viven en Postgres (lib/repo.ts);
 * aquí solo quedan valores de referencia del reglamento y fallbacks de UI.
 */
export const TOURNAMENT = {
  nombre: "Copa México VALORANT 2026",
  edicion: "Edición I",
  version: "v1.3",
  temporada: "2026",
  cupoMax: 64,
  cuota: "Por definir",
  bolsa: "Por definir",
  servidor: "LATAM-N / México",
  inicioInscripciones: "Por definir",
};

/** Calendario modelo — Anexo A del reglamento. */
export const CALENDAR = [
  { semana: "Sem. 1–2", titulo: "Inscripciones abiertas", detalle: "Registro de equipos, pago y carga de roster", estado: "activo" },
  { semana: "Sem. 3", titulo: "Verificación y cierre de roster", detalle: "Validación de identidades, tope de puntos y cupos", estado: "proximo" },
  { semana: "Sem. 4–5", titulo: "Clasificatorias abiertas", detalle: "Bo1 con semis y final Bo3 · Determina 32 equipos", estado: "proximo" },
  { semana: "Sem. 6–8", titulo: "Fase de grupos", detalle: "8 grupos de 4 · GSL · Bo3 · Clasifican 16", estado: "proximo" },
  { semana: "Sem. 9–11", titulo: "Playoffs", detalle: "Doble eliminación · Bo3 · Define el Top 4", estado: "proximo" },
  { semana: "Sem. 12", titulo: "Gran Final", detalle: "Bo5 · Transmisión oficial · Premiación", estado: "proximo" },
];

/** Tabla de conceptos de puntuación del ranking — Art. 43 (referencia). */
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
