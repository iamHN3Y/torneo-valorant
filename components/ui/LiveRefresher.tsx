"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Refresco de datos en reposo para la Home (NO ligado al toggle de motion:
 * es una decisión de datos, no de animación). Refresca cada 60s si hay un
 * partido en vivo, o cada 5 min como piso lento en caso contrario, para
 * detectar que un partido arrancó sin recarga manual. Se pausa cuando la
 * pestaña está oculta y refresca de inmediato al recuperar el foco.
 *
 * Montar SOLO en app/page.tsx (Home): en /admin/competicion o /inscripcion
 * router.refresh() descartaría estado transitorio de esas páginas.
 */
export default function LiveRefresher({
  hayPartidoEnVivo,
}: {
  hayPartidoEnVivo: boolean;
}) {
  const router = useRouter();
  const intervalMs = hayPartidoEnVivo ? 60_000 : 5 * 60_000;

  useEffect(() => {
    let id: ReturnType<typeof setInterval> | null = null;

    function start() {
      if (id !== null) return;
      id = setInterval(() => {
        if (!document.hidden) router.refresh();
      }, intervalMs);
    }
    function stop() {
      if (id !== null) {
        clearInterval(id);
        id = null;
      }
    }
    function onVisibilityChange() {
      if (document.hidden) {
        stop();
      } else {
        router.refresh();
        start();
      }
    }

    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [intervalMs, router]);

  return null;
}
