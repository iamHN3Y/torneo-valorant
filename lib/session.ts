import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  signSession,
  verifySession,
  SESSION_MAX_AGE,
  type SessionPayload,
  type Role,
} from "./auth";

const COOKIE = "cmx_session";

/** Lee la sesión actual (o null). Seguro en Server Components. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySession(store.get(COOKIE)?.value);
}

/** Crea la cookie de sesión. Solo desde Server Actions / Route Handlers. */
export async function setSession(data: {
  role: Role;
  id: string;
  name: string;
}) {
  const store = await cookies();
  store.set(COOKIE, signSession(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

/** Borra la sesión. Solo desde Server Actions / Route Handlers. */
export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE);
}

/** Exige sesión de equipo; si no, redirige al login. */
export async function requireTeam(): Promise<SessionPayload> {
  const s = await getSession();
  if (!s || s.role !== "team") redirect("/ingresar");
  return s;
}

/** Exige sesión de Comité Organizador; si no, redirige al login. */
export async function requireCo(): Promise<SessionPayload> {
  const s = await getSession();
  if (!s || s.role !== "co") redirect("/ingresar?co=1");
  return s;
}
