import MarqueeTrack from "./MarqueeTrack";

/**
 * Loop infinito de texto (CSS puro, sin JS para la animación). Server
 * Component: solo delega el botón de pausa/play (requisito WCAG 2.2.2) a
 * un pequeño componente cliente. Se pausa automáticamente en hover/focus,
 * y `prefers-reduced-motion` / el toggle "Mínimo" la detienen por completo
 * (ver app/globals.css).
 */
export default function Marquee({
  items,
  className = "",
}: {
  items: string[];
  className?: string;
}) {
  if (items.length === 0) return null;
  return <MarqueeTrack items={items} className={className} />;
}
