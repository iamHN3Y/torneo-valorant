"use server";

import { revalidatePath } from "next/cache";
import { requireTeam } from "@/lib/session";
import { getTeamById, saveRoster } from "@/lib/repo";
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
