"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Aparición al entrar en viewport (progressive disclosure).
 *
 * Degradación segura: el contenido se renderiza VISIBLE por defecto. Solo se
 * oculta para animar DESPUÉS de que el componente monta en el cliente. Si el
 * JS nunca corre (navegador no soportado, error de hidratación, dev cross-
 * origin bloqueado), el contenido permanece visible en lugar de quedar en
 * opacity:0. Respeta prefers-reduced-motion.
 */
export default function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false); // el mecanismo de animación está activo
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Sin animación: mostrar tal cual.
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setVisible(true);
      return;
    }

    // Si ya está a la vista al montar, muéstralo sin ocultarlo (evita parpadeo).
    const rect = el.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    if (inView) {
      setVisible(true);
      return;
    }

    // Está fuera de pantalla: ahora sí lo ocultamos y observamos su entrada.
    setArmed(true);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const hidden = armed && !visible;

  return (
    <div
      ref={ref}
      data-hidden={hidden ? "true" : undefined}
      style={{ transitionDelay: `${delay}ms` }}
      className={`reveal ${className}`}
    >
      {children}
    </div>
  );
}
