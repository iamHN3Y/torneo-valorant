import type { RankId } from "./types";

/** Tabla de puntos por rango — Art. 16 del reglamento. */
export const RANKS: { id: RankId; label: string; points: number; nota?: string }[] = [
  { id: "hierro_oro", label: "Hierro – Oro", points: 2 },
  { id: "platino", label: "Platino", points: 4 },
  { id: "diamante", label: "Diamante", points: 6 },
  { id: "ascendente", label: "Ascendente", points: 8 },
  { id: "inmortal", label: "Inmortal", points: 11, nota: "Máx. 2 por roster" },
  { id: "radiante", label: "Radiante", points: 14, nota: "Máx. 1 por roster" },
];

const RANK_MAP = new Map(RANKS.map((r) => [r.id, r]));

export function rankPoints(id: RankId): number {
  return RANK_MAP.get(id)?.points ?? 0;
}

export function rankLabel(id: RankId): string {
  return RANK_MAP.get(id)?.label ?? id;
}

/** Topes competitivos — Art. 16 (rama amateur). */
export const ROSTER_RULES = {
  topePuntosAmateur: 30,
  titularesRequeridos: 5,
  suplentesMax: 2,
  maxInmortal: 2,
  maxRadiante: 1,
  minMexicanos: 1, // Art. 11
};
