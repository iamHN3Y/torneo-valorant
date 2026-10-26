"use server";

import { revalidatePath } from "next/cache";
import { requireTeam } from "@/lib/session";
import { getTeamById, saveRoster, setTeamAccent, TEAM_ACCENTS } from "@/lib/repo";
import { validateRoster } from "@/lib/validation";
import { sanitizePlayers } from "@/lib/roster";

export interface SaveState {
  ok?: boolean;
  error?: string;
}

/**
 * Guarda el roster del equipo autenticado.
 *  - Bloqueado si el CO cerró el roster (Art. 13).
 *  - Validado contra el reglamento (Art. 11, 12, 16) igual que la inscripción.
 */
export async function saveRosterAction(rawPlayers: unknown): Promise<SaveState> {
  const session = await requireTeam();

  let team;
  try {
    team = await getTeamById(session.id);
  } catch {
    return { error: "No se pudo conectar con la base de datos." };
  }
  if (!team) return { error: "Equipo no encontrado." };
  if (team.rosterLocked) {
    return {
      error:
        "El roster está bloqueado por el Comité Organizador. No puedes editarlo ahora.",
    };
  }

  const players = sanitizePlayers(rawPlayers);

  const result = validateRoster(
    players.map((p, i) => ({ id: String(i), ...p })),
    team.rama
  );
  if (!result.valido) {
    return { error: result.errores[0] ?? "El roster no cumple el reglamento." };
  }

  try {
    await saveRoster(team.id, players);
  } catch {
    return { error: "No se pudo guardar el roster. Intenta de nuevo." };
  }

  revalidatePath("/equipo");
  return { ok: true };
}

export interface AccentState {
  ok?: boolean;
  error?: string;
}

/**
 * Cambia el acento de color del equipo autenticado (Fase 5).
 * Elegibilidad (defensa en profundidad, no confiar en el cliente): mismo
 * criterio usado para "puede editar roster" en /equipo — roster NO
 * bloqueado por el CO y estado del equipo distinto de 'aprobado' (una vez
 * aprobado, la identidad visual del equipo queda congelada igual que su
 * roster). Se re-verifica contra el estado REAL en BD, no el que el
 * cliente afirme tener.
 */
export async function setAccentAction(accent: string): Promise<AccentState> {
  const session = await requireTeam();

  if (!TEAM_ACCENTS.includes(accent as (typeof TEAM_ACCENTS)[number])) {
    return { error: "Acento inválido." };
  }

  let team;
  try {
    team = await getTeamById(session.id);
  } catch {
    return { error: "No se pudo conectar con la base de datos." };
  }
  if (!team) return { error: "Equipo no encontrado." };
  if (team.rosterLocked || team.estado === "aprobado") {
    return {
      error:
        "Tu identidad visual está congelada (roster bloqueado o inscripción aprobada).",
    };
  }

  try {
    await setTeamAccent(team.id, accent);
  } catch {
    return { error: "No se pudo guardar el acento. Intenta de nuevo." };
  }

  revalidatePath("/equipo");
  revalidatePath("/bracket");
  revalidatePath("/ranking");
  return { ok: true };
}
