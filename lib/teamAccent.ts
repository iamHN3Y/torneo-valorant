/**
 * Paleta cerrada de acentos de equipo (Fase 5). Vive en un módulo aparte
 * (sin importar `lib/db`/`postgres`) para que los componentes cliente
 * (ej. AccentSelector) puedan usarla sin arrastrar el driver de BD al
 * bundle del navegador. `lib/repo.ts` re-exporta estos símbolos.
 *
 * Ninguno de los 6 reutiliza los hex de --color-brand (#FF4655),
 * --color-teal (#19E8C8) ni --color-gold (#E8C37A) de app/globals.css.
 */
export const TEAM_ACCENTS = [
  "violeta",
  "azul",
  "cobalto",
  "magenta",
  "lima",
  "rosa",
] as const;
export type TeamAccent = (typeof TEAM_ACCENTS)[number];

export const TEAM_ACCENT_HEX: Record<TeamAccent, string> = {
  violeta: "#A78BFA",
  azul: "#4FB8E8",
  cobalto: "#5B7FEA",
  magenta: "#D874E0",
  lima: "#B8D93C",
  rosa: "#DE5FB0",
};
