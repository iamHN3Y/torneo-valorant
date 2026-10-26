"use server";

import { redirect } from "next/navigation";
import {
  getActiveTournament,
  createTeam,
  getTeamByLogin,
} from "@/lib/repo";
import { hashPassword } from "@/lib/auth";
import { setSession } from "@/lib/session";
import { validateRoster } from "@/lib/validation";
import { sanitizePlayers } from "@/lib/roster";
import type { Rama } from "@/lib/types";

export interface RegisterState {
  error?: string;
}

export interface RegisterInput {
  nombre: string;
  tag: string;
  rama: string;
  password: string;
  players: unknown;
}

/**
 * Crea un equipo real (con contraseña) a partir del formulario de inscripción.
 * Valida contra el reglamento, evita duplicados NOMBRE#TAG, lo deja en revisión
 * y deja la sesión iniciada para llevar al capitán directo a su panel.
 */
export async function registerTeamAction(
  input: RegisterInput
): Promise<RegisterState> {
  const nombre = String(input.nombre ?? "").trim();
  const tag = String(input.tag ?? "")
    .trim()
    .toUpperCase();
  const rama: Rama = input.rama === "elite" ? "elite" : "amateur";
  const password = String(input.password ?? "");

  if (nombre.length < 3)
    return { error: "El nombre del equipo debe tener al menos 3 caracteres." };
  if (nombre.includes("#"))
    return { error: "El nombre del equipo no puede contener '#'." };
  if (tag.length < 2 || tag.length > 5)
    return { error: "El tag debe tener entre 2 y 5 caracteres." };
  if (password.length < 6)
    return { error: "La contraseña debe tener al menos 6 caracteres." };

  const players = sanitizePlayers(input.players);
  const result = validateRoster(
    players.map((p, i) => ({ id: String(i), ...p })),
    rama
  );
  if (!result.valido)
    return { error: result.errores[0] ?? "El roster no cumple el reglamento." };

  // Duplicado por login
  try {
    const dup = await getTeamByLogin(nombre, tag);
    if (dup)
      return {
        error: `Ya existe un equipo "${nombre}#${tag}". Elige otro nombre o tag.`,
      };
  } catch {
    return { error: "No se pudo conectar con la base de datos." };
  }

  let teamId: string;
  try {
    const active = await getActiveTournament();
    if (!active || active.estado !== "inscripciones") {
      return { error: "Las inscripciones están cerradas en este momento." };
    }
    const passwordHash = await hashPassword(password);
    teamId = await createTeam(
      {
        tournamentId: active.id,
        nombre,
        tag,
        rama,
        // Torneo gratuito: directo a revisión. De pago: pendiente de pago.
        estado: active.gratuito ? "en_revision" : "pendiente_pago",
        passwordHash,
      },
      players
    );
  } catch (e) {
    if (
      e &&
      typeof e === "object" &&
      "code" in e &&
      (e as { code?: string }).code === "23505"
    ) {
      return { error: `Ya existe un equipo "${nombre}#${tag}".` };
    }
    return { error: "No se pudo completar la inscripción. Intenta de nuevo." };
  }

  await setSession({ role: "team", id: teamId, name: `${nombre}#${tag}` });
  redirect("/equipo");
}
