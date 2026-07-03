"use server";

import { redirect } from "next/navigation";
import { getCoUserByUsername, getTeamByLogin } from "@/lib/repo";
import { verifyPassword } from "@/lib/auth";
import { setSession, clearSession } from "@/lib/session";

export interface LoginState {
  error?: string;
}

/** Login de equipo con identificador NOMBRE#TAG + contraseña. */
export async function loginTeam(
  _prev: LoginState,
  form: FormData
): Promise<LoginState> {
  const identifier = String(form.get("identifier") ?? "").trim();
  const password = String(form.get("password") ?? "");

  const hashAt = identifier.lastIndexOf("#");
  if (hashAt < 1 || !password) {
    return { error: "Ingresa NOMBRE#TAG y tu contraseña." };
  }
  const nombre = identifier.slice(0, hashAt).trim();
  const tag = identifier.slice(hashAt + 1).trim();
  if (!nombre || !tag) {
    return { error: "Formato inválido. Usa NOMBRE#TAG (ej. Jaguares#JAG)." };
  }

  let team;
  try {
    team = await getTeamByLogin(nombre, tag);
  } catch {
    return { error: "No se pudo conectar con la base de datos." };
  }
  if (!team || !(await verifyPassword(password, team.passwordHash))) {
    return { error: "Credenciales incorrectas." };
  }

  await setSession({
    role: "team",
    id: team.id,
    name: `${team.nombre}#${team.tag}`,
  });
  redirect("/equipo");
}

/** Login del Comité Organizador con usuario + contraseña. */
export async function loginCo(
  _prev: LoginState,
  form: FormData
): Promise<LoginState> {
  const username = String(form.get("username") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!username || !password) {
    return { error: "Ingresa usuario y contraseña." };
  }

  let user;
  try {
    user = await getCoUserByUsername(username);
  } catch {
    return { error: "No se pudo conectar con la base de datos." };
  }
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Credenciales incorrectas." };
  }

  await setSession({ role: "co", id: user.id, name: user.nombre });
  redirect("/admin");
}

/** Cierra la sesión actual. */
export async function logout() {
  await clearSession();
  redirect("/");
}
