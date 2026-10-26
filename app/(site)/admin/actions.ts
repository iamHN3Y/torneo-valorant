"use server";

import { revalidatePath } from "next/cache";
import { requireCo } from "@/lib/session";
import {
  updateTeamEstado,
  setRosterLock,
  setTeamNota,
  createTournament,
  updateTournamentEstado,
  setTournamentGratuito,
  setTournamentCuota,
  writeAudit,
  type AuditTipo,
  type TournamentEstado,
} from "@/lib/repo";
import type { EstadoInscripcion } from "@/lib/types";

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
  const session = await requireCo();
  if (!TEAM_ESTADOS.includes(estado as EstadoInscripcion)) {
    return { error: "Estado inválido." };
  }
  try {
    await updateTeamEstado(teamId, estado as EstadoInscripcion);
  } catch {
    return { error: "No se pudo actualizar el equipo." };
  }
  await auditSafe({
    coUserId: session.id,
    tipo: "team_estado",
    entidadId: teamId,
    after: { estado },
    descripcion: `Cambió el estado del equipo a "${estado}"`,
  });
  revalidatePath("/admin");
  return { ok: true };
}

export async function toggleRosterLockAction(
  teamId: string,
  locked: boolean
): Promise<ActionResult> {
  const session = await requireCo();
  try {
    await setRosterLock(teamId, locked);
  } catch {
    return { error: "No se pudo cambiar el bloqueo del roster." };
  }
  await auditSafe({
    coUserId: session.id,
    tipo: "roster_lock",
    entidadId: teamId,
    after: { locked },
    descripcion: locked ? "Bloqueó el roster del equipo" : "Desbloqueó el roster del equipo",
  });
  revalidatePath("/admin");
  return { ok: true };
}

export async function setTeamNotaAction(
  teamId: string,
  nota: string
): Promise<ActionResult> {
  const session = await requireCo();
  try {
    await setTeamNota(teamId, nota.slice(0, 300));
  } catch {
    return { error: "No se pudo guardar la nota." };
  }
  await auditSafe({
    coUserId: session.id,
    tipo: "team_nota",
    entidadId: teamId,
    after: { nota: nota.slice(0, 300) },
    descripcion: "Actualizó la nota del equipo",
  });
  revalidatePath("/admin");
  return { ok: true };
}

/* ------------------------------ Torneos ------------------------------ */

export async function createTournamentAction(
  nombre: string
): Promise<ActionResult> {
  const session = await requireCo();
  const n = nombre.trim();
  if (n.length < 3) return { error: "El nombre es muy corto (mín. 3)." };
  try {
    await createTournament(n);
  } catch {
    return { error: "No se pudo crear el torneo." };
  }
  await auditSafe({
    coUserId: session.id,
    tipo: "tournament_create",
    after: { nombre: n },
    descripcion: `Creó el torneo "${n}"`,
  });
  revalidatePath("/admin");
  return { ok: true };
}

export async function setTournamentEstadoAction(
  id: string,
  estado: string
): Promise<ActionResult> {
  const session = await requireCo();
  if (!TOURNAMENT_ESTADOS.includes(estado as TournamentEstado)) {
    return { error: "Estado inválido." };
  }
  try {
    await updateTournamentEstado(id, estado as TournamentEstado);
  } catch {
    return { error: "No se pudo actualizar el torneo." };
  }
  await auditSafe({
    coUserId: session.id,
    tipo: "tournament_estado",
    entidadId: id,
    after: { estado },
    descripcion: `Cambió el estado del torneo a "${estado}"`,
  });
  revalidatePath("/admin");
  return { ok: true };
}

export async function setTournamentGratuitoAction(
  id: string,
  gratuito: boolean
): Promise<ActionResult> {
  const session = await requireCo();
  try {
    await setTournamentGratuito(id, gratuito);
  } catch {
    return { error: "No se pudo cambiar la modalidad." };
  }
  await auditSafe({
    coUserId: session.id,
    tipo: "tournament_gratuito",
    entidadId: id,
    after: { gratuito },
    descripcion: gratuito ? "Marcó el torneo como gratuito" : "Marcó el torneo como de pago",
  });
  revalidatePath("/admin");
  revalidatePath("/inscripcion");
  revalidatePath("/");
  return { ok: true };
}

export async function setTournamentCuotaAction(
  id: string,
  cuota: string
): Promise<ActionResult> {
  const session = await requireCo();
  const c = cuota.trim().slice(0, 60);
  if (!c) return { error: "Escribe la cuota (ej. $250 MXN por equipo)." };
  try {
    await setTournamentCuota(id, c);
  } catch {
    return { error: "No se pudo guardar la cuota." };
  }
  await auditSafe({
    coUserId: session.id,
    tipo: "tournament_cuota",
    entidadId: id,
    after: { cuota: c },
    descripcion: `Actualizó la cuota del torneo a "${c}"`,
  });
  revalidatePath("/admin");
  revalidatePath("/inscripcion");
  return { ok: true };
}
