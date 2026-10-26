"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#·/\\";

/**
 * Efecto de "descifrado": muestra caracteres aleatorios que van
 * resolviéndose hacia `text` con requestAnimationFrame. El texto final
 * SIEMPRE existe de forma accesible en el DOM vía un `<span className="sr-only">`
 * duplicado (no `aria-label`: ARIA desaconseja `aria-label` en elementos sin
 * rol semántico como un `<span>` genérico — varios lectores de pantalla lo
 * ignoran). La capa visual/animada completa se marca `aria-hidden="true"`
 * para no duplicar el anuncio. Si `prefersReducedMotion()` es true, se
 * muestra el texto final de inmediato sin animar (patrón de Reveal.tsx:
 * visible por defecto, sólo se oculta cuando el mecanismo de animación se
 * arma en el cliente).
 */
export default function ScrambleText({
  text,
  className = "",
  durationMs = 700,
  startDelayMs = 0,
  play = true,
}: {
  text: string;
  className?: string;
  durationMs?: number;
  startDelayMs?: number;
  /** Cambiar de false a true (o incrementar `playKey` en el padre) dispara la animación. */
  play?: boolean;
}) {
  const [display, setDisplay] = useState(text);
  const frameRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!play || prefersReducedMotion()) {
      setDisplay(text);
      return;
    }

    const start = performance.now() + startDelayMs;

    function tick(now: number) {
      const elapsed = now - start;
      if (elapsed < 0) {
        frameRef.current = requestAnimationFrame(tick);
        return;
      }
      const progress = Math.min(1, elapsed / durationMs);
      const resolvedCount = Math.floor(progress * text.length);
      let out = "";
      for (let i = 0; i < text.length; i++) {
        if (i < resolvedCount || text[i] === " ") {
          out += text[i];
        } else {
          out += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }
      }
      setDisplay(out);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(text);
      }
    }
    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, [text, play, durationMs, startDelayMs]);

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{display}</span>
    </span>
  );
}
