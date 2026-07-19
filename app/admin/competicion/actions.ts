"use server";

import { revalidatePath } from "next/cache";
import { requireCo } from "@/lib/session";
import {
  getActiveTournament,
  createGroup,
  addGroupTeam,
  removeGroupTeam,
  createMatch,
  setMatchResult,
  deleteMatch,
  createRankingAdjustment,
  deleteRankingAdjustment,
  type MatchFormato,
  type MatchEstado,
} from "@/lib/repo";

export interface ActionResult {
  ok?: boolean;
  error?: string;
}

const FORMATOS: MatchFormato[] = ["Bo1", "Bo3", "Bo5"];
const ESTADOS: MatchEstado[] = ["programado", "en_vivo", "finalizado"];

function refresh() {
  revalidatePath("/admin/competicion");
  revalidatePath("/bracket");
  revalidatePath("/ranking");
}

async function activeTournamentId(): Promise<string | null> {
  const t = await getActiveTournament();
  return t?.id ?? null;
}

export async function createGroupAction(nombre: string): Promise<ActionResult> {
  await requireCo();
  const n = nombre.trim();
  if (!n) return { error: "Escribe un nombre de grupo (ej. A)." };
  try {
    const tid = await activeTournamentId();
    if (!tid) return { error: "No hay torneo activo." };
    await createGroup(tid, n.slice(0, 20));
  } catch {
    return { error: "No se pudo crear el grupo." };
  }
  refresh();
  return { ok: true };
}

export async function addGroupTeamAction(
  groupId: string,
  teamId: string
): Promise<ActionResult> {
  await requireCo();
  if (!groupId || !teamId) return { error: "Selecciona un equipo." };
  try {
    await addGroupTeam(groupId, teamId);
  } catch {
    return { error: "No se pudo agregar el equipo." };
  }
  refresh();
  return { ok: true };
}

export async function removeGroupTeamAction(
  groupId: string,
  teamId: string
): Promise<ActionResult> {
  await requireCo();
  try {
    await removeGroupTeam(groupId, teamId);
  } catch {
    return { error: "No se pudo quitar el equipo." };
  }
  refresh();
  return { ok: true };
}

export async function createMatchAction(input: {
  groupId: string | null;
  ronda: string;
  formato: string;
  teamAId: string | null;
  teamBId: string | null;
}): Promise<ActionResult> {
  await requireCo();
  const ronda = input.ronda.trim();
  if (!ronda) return { error: "Escribe la ronda (ej. Cuartos, Grupo A)." };
  const formato = FORMATOS.includes(input.formato as MatchFormato)
    ? (input.formato as MatchFormato)
    : "Bo3";
  if (input.teamAId && input.teamBId && input.teamAId === input.teamBId) {
    return { error: "Un equipo no puede enfrentarse a sí mismo." };
  }
  try {
    const tid = await activeTournamentId();
    if (!tid) return { error: "No hay torneo activo." };
    await createMatch({
      tournamentId: tid,
      groupId: input.groupId || null,
      ronda: ronda.slice(0, 40),
      formato,
      teamAId: input.teamAId || null,
      teamBId: input.teamBId || null,
    });
  } catch {
    return { error: "No se pudo crear el partido." };
  }
  refresh();
  return { ok: true };
}

export async function setMatchResultAction(
  matchId: string,
  scoreA: number,
  scoreB: number,
  estado: string
): Promise<ActionResult> {
  await requireCo();
  const est = ESTADOS.includes(estado as MatchEstado)
    ? (estado as MatchEstado)
    : "programado";
  const sa = Math.max(0, Math.min(5, Math.floor(scoreA) || 0));
  const sb = Math.max(0, Math.min(5, Math.floor(scoreB) || 0));
  try {
    await setMatchResult(matchId, sa, sb, est);
  } catch {
    return { error: "No se pudo guardar el resultado." };
  }
  refresh();
  return { ok: true };
}

export async function deleteMatchAction(matchId: string): Promise<ActionResult> {
  await requireCo();
  try {
    await deleteMatch(matchId);
  } catch {
    return { error: "No se pudo eliminar el partido." };
  }
  refresh();
  return { ok: true };
}

/* ------------------------- Ajustes de ranking (Art. 43) ------------------------- */

export async function createAdjustmentAction(
  teamId: string,
  puntos: number,
  motivo: string
): Promise<ActionResult> {
  await requireCo();
  const m = motivo.trim();
  const p = Math.max(-500, Math.min(500, Math.trunc(puntos) || 0));
  if (!teamId) return { error: "Selecciona un equipo." };
  if (p === 0) return { error: "Los puntos no pueden ser 0." };
  if (m.length < 3) return { error: "Describe el motivo (mín. 3 caracteres)." };
  try {
    await createRankingAdjustment(teamId, p, m.slice(0, 200));
  } catch {
    return { error: "No se pudo guardar el ajuste." };
  }
  refresh();
  return { ok: true };
}

export async function deleteAdjustmentAction(id: string): Promise<ActionResult> {
  await requireCo();
  try {
    await deleteRankingAdjustment(id);
  } catch {
    return { error: "No se pudo eliminar el ajuste." };
  }
  refresh();
  return { ok: true };
}
