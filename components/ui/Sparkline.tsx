/**
 * Sparkline SVG estático (Server Component): visualiza una serie corta de
 * puntos (el historial de ranking) sin necesitar JS de cliente. Puramente
 * decorativo — el valor numérico de al lado ya comunica el dato — así que
 * se marca aria-hidden y no participa del árbol de accesibilidad.
 */
export default function Sparkline({
  data,
  width = 96,
  height = 28,
  className = "text-teal",
}: {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
}) {
  if (data.length < 2) {
    // Sin suficientes cortes para trazar una tendencia: línea plana neutra.
    const y = height / 2;
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden="true"
        focusable="false"
        className={className}
      >
        <line
          x1={2}
          y1={y}
          x2={width - 2}
          y2={y}
          stroke="currentColor"
          strokeWidth={1.5}
          strokeDasharray="3 3"
          opacity={0.35}
        />
      </svg>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padX = 2;
  const padY = 3;
  const usableW = width - padX * 2;
  const usableH = height - padY * 2;

  const points = data
    .map((v, i) => {
      const x = padX + (i / (data.length - 1)) * usableW;
      const y = padY + usableH - ((v - min) / range) * usableH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const lastX = padX + usableW;
  const lastY =
    padY + usableH - ((data[data.length - 1] - min) / range) * usableH;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r={2} fill="currentColor" />
    </svg>
  );
}
