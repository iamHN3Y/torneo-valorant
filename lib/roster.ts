import { RANKS } from "./ranks";
import type { PlayerInput } from "./repo";
import type { RankId, Rol } from "./types";

const RANK_IDS = new Set(RANKS.map((r) => r.id));

/** Limpia y acota datos de roster que llegan del cliente (evita valores inválidos). */
export function sanitizePlayers(raw: unknown): PlayerInput[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 7).map((p) => {
    const o = (p ?? {}) as Record<string, unknown>;
    const rankId = String(o.rankId) as RankId;
    return {
      nombre: String(o.nombre ?? "").slice(0, 40),
      riotId: String(o.riotId ?? "").slice(0, 60),
      rankId: RANK_IDS.has(rankId) ? rankId : "hierro_oro",
      nacionalidad: String(o.nacionalidad ?? "MX").slice(0, 3),
      rol: (o.rol === "suplente" ? "suplente" : "titular") as Rol,
      esCapitan: Boolean(o.esCapitan),
      riotVerificado: Boolean(o.riotVerificado),
    };
  });
}
