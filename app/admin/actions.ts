"use server";

import { revalidatePath } from "next/cache";
import { requireCo } from "@/lib/session";
import {
  updateTeamEstado,
  setRosterLock,
  setTeamNota,
  createTournament,
  updateTournamentEstado,
  type TournamentEstado,
} from "@/lib/repo";
import type { EstadoInscripcion } from "@/lib/types";

export interface ActionResult {
  ok?: boolean;
  error?: string;
}

const TEAM_ESTADOS: EstadoInscripcion[] = [
  "borrador",
  "pendiente_pago",
  "en_revision",
  "aprobado",
  "rechazado",
  "lista_espera",
];

const TOURNAMENT_ESTADOS: TournamentEstado[] = [
  "borrador",
  "inscripciones",
  "en_curso",
  "finalizado",
];

/* ------------------------------ Equipos ------------------------------ */

export async function setTeamEstadoAction(
  teamId: string,
  estado: string
): Promise<ActionResult> {
  await requireCo();
  if (!TEAM_ESTADOS.includes(estado as EstadoInscripcion)) {
    return { error: "Estado inválido." };
  }
  try {
    await updateTeamEstado(teamId, estado as EstadoInscripcion);
  } catch {
    return { error: "No se pudo actualizar el equipo." };
  }
  revalidatePath("/admin");
  return { ok: true };
}

export async function toggleRosterLockAction(
  teamId: string,
  locked: boolean
): Promise<ActionResult> {
  await requireCo();
  try {
    await setRosterLock(teamId, locked);
  } catch {
    return { error: "No se pudo cambiar el bloqueo del roster." };
  }
  revalidatePath("/admin");
  return { ok: true };
}

export async function setTeamNotaAction(
  teamId: string,
  nota: string
): Promise<ActionResult> {
  await requireCo();
  try {
    await setTeamNota(teamId, nota.slice(0, 300));
  } catch {
    return { error: "No se pudo guardar la nota." };
  }
  revalidatePath("/admin");
  return { ok: true };
}

/* ------------------------------ Torneos ------------------------------ */

export async function createTournamentAction(
  nombre: string
): Promise<ActionResult> {
  await requireCo();
  const n = nombre.trim();
  if (n.length < 3) return { error: "El nombre es muy corto (mín. 3)." };
  try {
    await createTournament(n);
  } catch {
    return { error: "No se pudo crear el torneo." };
  }
  revalidatePath("/admin");
  return { ok: true };
}

export async function setTournamentEstadoAction(
  id: string,
  estado: string
): Promise<ActionResult> {
  await requireCo();
  if (!TOURNAMENT_ESTADOS.includes(estado as TournamentEstado)) {
    return { error: "Estado inválido." };
  }
  try {
    await updateTournamentEstado(id, estado as TournamentEstado);
  } catch {
    return { error: "No se pudo actualizar el torneo." };
  }
  revalidatePath("/admin");
  return { ok: true };
}
