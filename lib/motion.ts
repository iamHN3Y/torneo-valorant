/**
 * Sistema de motion — punto de verdad único para decidir si la UI debe
 * reducir animaciones. Combina:
 *  1. La preferencia explícita del usuario (cookie `cmx_motion`, reflejada
 *     como atributo `data-motion` en `<html>` por app/layout.tsx).
 *  2. La preferencia del sistema operativo (`prefers-reduced-motion`).
 *
 * No debe haber llamadas directas a `matchMedia("(prefers-reduced-motion...")`
 * en ningún otro archivo del proyecto: todas deben pasar por
 * `prefersReducedMotion()` de este módulo.
 */

export type MotionPref = "auto" | "reduced" | "full";

/** Nombre de la cookie de preferencia de motion (compartido cliente/servidor). */
export const MOTION_COOKIE = "cmx_motion";

/**
 * Solo debe llamarse en cliente (componentes "use client", efectos, etc.).
 * Prioridad: atributo `data-motion` explícito en <html> > preferencia del SO.
 *
 * LIMITACIÓN CONOCIDA — "Cine" (data-motion="full") vs. `@media
 * (prefers-reduced-motion: reduce)` del SO:
 * Esta función solo controla animaciones dirigidas por JS (ripple,
 * IntersectionObserver de Reveal/CountUp, etc.). El override "full" NO tiene
 * forma de anular el `@media (prefers-reduced-motion: reduce)` de
 * app/globals.css, porque ese es un media feature del navegador ligado a la
 * preferencia real del SO: no existe un selector CSS que lo desactive sin
 * añadir `!important` a cada regla animada del proyecto (pelea que no vale
 * la pena para este alcance). Consecuencia práctica: si el SO pide
 * reduce-motion y el usuario elige "Cine", las animaciones JS (ripple, etc.)
 * SÍ se ejecutan, pero las animaciones puramente CSS (hero-sweep,
 * anim-flicker, marquee, tilt) se mantienen apagadas por el media query del
 * SO. Es un estado híbrido aceptado, no un bug: "full" solo cubre JS.
 */
export function prefersReducedMotion(): boolean {
  if (typeof document !== "undefined") {
    const attr = document.documentElement.getAttribute("data-motion");
    if (attr === "reduced") return true;
    if (attr === "full") return false;
    // "auto" o sin atributo: cae al chequeo del SO.
  }
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
