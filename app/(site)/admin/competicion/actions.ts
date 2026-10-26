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
  writeAudit,
  getMatchForRevert,
  getMatchSummary,
  revertMatchResult,
  publishSorteo,
  type AuditTipo,
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
  revalidatePath("/bracket/sorteo");
  revalidatePath("/ranking");
}

async function activeTournamentId(): Promise<string | null> {
  const t = await getActiveTournament();
  return t?.id ?? null;
}

/**
 * Escribe una entrada de auditoría sin propagar el error: la mutación ya se
 * aplicó, así que un fallo al auditar nunca debe ocultarle al usuario que
 * la acción real tuvo éxito. Solo se loguea en servidor.
 */
async function auditSafe(input: {
  coUserId: string;
  tipo: AuditTipo;
  entidadId?: string | null;
  revierteAuditId?: string | null;
  before?: unknown;
  after?: unknown;
  descripcion: string;
}): Promise<void> {
  try {
    await writeAudit(input);
  } catch (err) {
    console.error("[audit_log] no se pudo escribir la entrada de auditoría", err);
  }
}

export async function createGroupAction(nombre: string): Promise<ActionResult> {
  const session = await requireCo();
  const n = nombre.trim();
  if (!n) return { error: "Escribe un nombre de grupo (ej. A)." };
  try {
    const tid = await activeTournamentId();
    if (!tid) return { error: "No hay torneo activo." };
    await createGroup(tid, n.slice(0, 20));
  } catch {
    return { error: "No se pudo crear el grupo." };
  }
  await auditSafe({
    coUserId: session.id,
    tipo: "group_create",
    after: { nombre: n.slice(0, 20) },
    descripcion: `Creó el grupo "${n.slice(0, 20)}"`,
  });
  refresh();
  return { ok: true };
}

export async function addGroupTeamAction(
  groupId: string,
  teamId: string
): Promise<ActionResult> {
  const session = await requireCo();
  if (!groupId || !teamId) return { error: "Selecciona un equipo." };
  try {
    await addGroupTeam(groupId, teamId);
  } catch {
    return { error: "No se pudo agregar el equipo." };
  }
  await auditSafe({
    coUserId: session.id,
    tipo: "group_team_add",
    entidadId: teamId,
    after: { groupId, teamId },
    descripcion: "Agregó un equipo a un grupo",
  });
  refresh();
  return { ok: true };
}

export async function removeGroupTeamAction(
  groupId: string,
  teamId: string
): Promise<ActionResult> {
  const session = await requireCo();
  try {
    await removeGroupTeam(groupId, teamId);
  } catch {
    return { error: "No se pudo quitar el equipo." };
  }
  await auditSafe({
    coUserId: session.id,
    tipo: "group_team_remove",
    entidadId: teamId,
    before: { groupId, teamId },
    descripcion: "Quitó un equipo de un grupo",
  });
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
  const session = await requireCo();
  const ronda = input.ronda.trim();
  if (!ronda) return { error: "Escribe la ronda (ej. Cuartos, Grupo A)." };
  const formato = FORMATOS.includes(input.formato as MatchFormato)
    ? (input.formato as MatchFormato)
    : "Bo3";
  if (input.teamAId && input.teamBId && input.teamAId === input.teamBId) {
    return { error: "Un equipo no puede enfrentarse a sí mismo." };
  }
  let newMatchId: string;
  try {
    const tid = await activeTournamentId();
    if (!tid) return { error: "No hay torneo activo." };
    newMatchId = await createMatch({
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
  await auditSafe({
    coUserId: session.id,
    tipo: "match_create",
    entidadId: newMatchId,
    after: { ronda: ronda.slice(0, 40), formato, teamAId: input.teamAId, teamBId: input.teamBId },
    descripcion: `Creó el partido "${ronda.slice(0, 40)}" (${formato})`,
  });
  refresh();
  return { ok: true };
}

export async function setMatchResultAction(
  matchId: string,
  scoreA: number,
  scoreB: number,
  estado: string
): Promise<ActionResult> {
  const session = await requireCo();
  const est = ESTADOS.includes(estado as MatchEstado)
    ? (estado as MatchEstado)
    : "programado";
  const sa = Math.max(0, Math.min(5, Math.floor(scoreA) || 0));
  const sb = Math.max(0, Math.min(5, Math.floor(scoreB) || 0));
  const before = await getMatchForRevert(matchId);
  if (!before) return { error: "El partido no existe." };
  try {
    await setMatchResult(matchId, sa, sb, est);
  } catch {
    return { error: "No se pudo guardar el resultado." };
  }
  const summary = await getMatchSummary(matchId);
  const equipos = summary
    ? `${summary.teamANombre ?? "Por definir"} vs ${summary.teamBNombre ?? "Por definir"}`
    : matchId.slice(0, 8);
  await auditSafe({
    coUserId: session.id,
    tipo: "match_result",
    entidadId: matchId,
    before: { scoreA: before.scoreA, scoreB: before.scoreB, estado: before.estado },
    after: { scoreA: sa, scoreB: sb, estado: est },
    descripcion: `Actualizó marcador de ${equipos}: ${sa}-${sb} (${est})`,
  });
  refresh();
  return { ok: true };
}

export async function undoMatchResultAction(auditId: string): Promise<ActionResult> {
  const session = await requireCo();
  const result = await revertMatchResult(auditId, session.id);
  if (!result.ok) return { error: result.reason };
  refresh();
  return { ok: true };
}

export async function deleteMatchAction(matchId: string): Promise<ActionResult> {
  const session = await requireCo();
  const summary = await getMatchSummary(matchId);
  try {
    await deleteMatch(matchId);
  } catch {
    return { error: "No se pudo eliminar el partido." };
  }
  await auditSafe({
    coUserId: session.id,
    tipo: "match_delete",
    entidadId: matchId,
    before: summary,
    descripcion: summary
      ? `Eliminó el partido "${summary.ronda}" (${summary.teamANombre ?? "Por definir"} vs ${summary.teamBNombre ?? "Por definir"})`
      : "Eliminó un partido",
  });
  refresh();
  return { ok: true };
}

export async function publishSorteoAction(): Promise<ActionResult> {
  const session = await requireCo();
  const tid = await activeTournamentId();
  if (!tid) return { error: "No hay torneo activo." };
  const result = await publishSorteo(tid);
  if (!result.ok) return { error: result.reason };
  await auditSafe({
    coUserId: session.id,
    tipo: "sorteo_publish",
    entidadId: tid,
    descripcion: "Publicó el sorteo de grupos",
  });
  refresh();
  return { ok: true };
}

/* ------------------------- Ajustes de ranking (Art. 43) ------------------------- */

export async function createAdjustmentAction(
  teamId: string,
  puntos: number,
  motivo: string
): Promise<ActionResult> {
  const session = await requireCo();
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
  await auditSafe({
    coUserId: session.id,
    tipo: "adjustment_create",
    entidadId: teamId,
    after: { puntos: p, motivo: m.slice(0, 200) },
    descripcion: `Registró ajuste de ranking (${p > 0 ? "+" : ""}${p}): ${m.slice(0, 200)}`,
  });
  refresh();
  return { ok: true };
}

export async function deleteAdjustmentAction(id: string): Promise<ActionResult> {
  const session = await requireCo();
  try {
    await deleteRankingAdjustment(id);
  } catch {
    return { error: "No se pudo eliminar el ajuste." };
  }
  await auditSafe({
    coUserId: session.id,
    tipo: "adjustment_delete",
    entidadId: id,
    descripcion: "Eliminó un ajuste de ranking",
  });
  refresh();
  return { ok: true };
}
