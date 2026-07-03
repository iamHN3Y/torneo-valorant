/** Texto con efecto glitch cyberpunk (capas teal/brand). */
export default function GlitchText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  return (
    <span className={`glitch ${className}`} data-text={text}>
      {text}
    </span>
  );
}
