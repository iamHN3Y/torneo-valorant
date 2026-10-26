"use server";

import { cookies } from "next/headers";
import { MOTION_COOKIE, type MotionPref } from "@/lib/motion";

const VALID: MotionPref[] = ["auto", "reduced", "full"];

/**
 * Guarda la preferencia de motion del usuario en una cookie.
 * No necesita revalidatePath: el único lector es app/layout.tsx, que ya es
 * dinámico (llama getSession()), y toda invocación de Server Action ya
 * refresca el árbol de Server Components en el cliente.
 */
export async function setMotionPreferenceAction(
  pref: MotionPref
): Promise<{ ok?: boolean; error?: string }> {
  if (!VALID.includes(pref)) return { error: "Preferencia de animación inválida." };
  (await cookies()).set(MOTION_COOKIE, pref, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return { ok: true };
}
