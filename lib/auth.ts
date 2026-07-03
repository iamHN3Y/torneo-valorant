import {
  scrypt,
  randomBytes,
  timingSafeEqual,
  createHmac,
} from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

/* ----------------------------- Contraseñas ----------------------------- */

/** Genera un hash `scrypt$salt$hash` (sal aleatoria por contraseña). */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scryptAsync(password.normalize(), salt, 64)) as Buffer;
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

/** Verifica una contraseña contra el hash almacenado (comparación segura). */
export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const salt = Buffer.from(parts[1], "hex");
  const expected = Buffer.from(parts[2], "hex");
  const derived = (await scryptAsync(
    password.normalize(),
    salt,
    expected.length
  )) as Buffer;
  return (
    expected.length === derived.length && timingSafeEqual(expected, derived)
  );
}

/* ------------------------------ Sesiones ------------------------------- */

export type Role = "team" | "co";

export interface SessionPayload {
  role: Role;
  id: string;
  name: string; // NOMBRE#TAG del equipo, o nombre del CO
  exp: number; // epoch en segundos
}

const THIRTY_DAYS = 60 * 60 * 24 * 30;

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET no está configurada (ver .env.local).");
  return s;
}

/** Firma un token de sesión: base64url(payload).hmac */
export function signSession(
  data: Omit<SessionPayload, "exp"> & { exp?: number }
): string {
  const payload: SessionPayload = {
    ...data,
    exp: data.exp ?? Math.floor(Date.now() / 1000) + THIRTY_DAYS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

/** Verifica el token y devuelve el payload, o null si es inválido/expirado. */
export function verifySession(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;

  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString()
    ) as SessionPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export const SESSION_MAX_AGE = THIRTY_DAYS;
