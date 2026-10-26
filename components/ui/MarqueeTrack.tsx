"use client";

import { useState } from "react";

/**
 * Pieza interactiva del Marquee (botón de pausa). Vive en su propio
 * componente cliente para que components/ui/Marquee.tsx pueda seguir
 * siendo un Server Component.
 */
export default function MarqueeTrack({
  items,
  className = "",
}: {
  items: string[];
  className?: string;
}) {
  const [paused, setPaused] = useState(false);
  const loop = [...items, ...items];

  return (
    <div className={`marquee relative overflow-hidden border-y border-line py-3 ${className}`}>
      <div
        className="marquee-track flex w-max items-center gap-3 whitespace-nowrap pr-3"
        /* Solo forzamos "paused" vía inline cuando el botón lo pide; en caso
           contrario dejamos el inline sin definir para que las reglas CSS de
           hover/focus-within (app/globals.css) puedan seguir pausando la
           animación sin que el inline las gane. */
        style={paused ? { animationPlayState: "paused" } : undefined}
        aria-hidden={false}
      >
        {loop.map((it, i) => (
          <span key={i} className="hud-chip shrink-0 text-bone-dim">
            {it}
          </span>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        aria-pressed={paused}
        aria-label={
          paused
            ? "Reanudar animación del carrusel de equipos"
            : "Pausar animación del carrusel de equipos"
        }
        title={paused ? "Reanudar" : "Pausar"}
        className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center border border-line bg-void2/90 text-teal backdrop-blur transition hover:border-teal"
      >
        <span className="font-mono text-[10px]">{paused ? "▶" : "❚❚"}</span>
      </button>
    </div>
  );
}
