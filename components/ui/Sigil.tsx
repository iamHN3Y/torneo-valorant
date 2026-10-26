/**
 * Sigilo generativo determinista (Fase 5): a partir del `teamId` (UUID,
 * nunca el tag — dos equipos distintos pueden compartir tag, ver
 * db/schema.sql donde la unicidad real es lower(nombre)+lower(tag)) deriva
 * un patrón geométrico simple y SIEMPRE el mismo para el mismo id.
 *
 * Puramente decorativo/identificador visual: el nombre/tag del equipo en
 * texto es lo que transmite la información, nunca el sigilo por sí solo.
 */

/** Hash FNV-1a de 32 bits: barato, determinista, sin dependencias. */
function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Generador determinista de enteros [0, 2^32) a partir de una semilla,
 *  usando un PRNG simple (mulberry32) — nada de Math.random(). */
function mulberry32(seed: number) {
  let a = seed;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Shape {
  cx: number;
  cy: number;
  size: number;
  rotation: number;
  kind: "triangle" | "square" | "line";
}

const GRID = 3;
const CELL = 96 / GRID;

function buildShapes(teamId: string): Shape[] {
  const seed = fnv1a(teamId);
  const rand = mulberry32(seed);
  const shapes: Shape[] = [];
  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      // No todas las celdas se llenan: ~60% de probabilidad determinista.
      if (rand() > 0.6) continue;
      const cx = col * CELL + CELL / 2;
      const cy = row * CELL + CELL / 2;
      const kinds: Shape["kind"][] = ["triangle", "square", "line"];
      const kind = kinds[Math.floor(rand() * kinds.length)];
      const rotation = Math.floor(rand() * 4) * 90 + Math.floor(rand() * 45);
      const size = CELL * (0.45 + rand() * 0.35);
      shapes.push({ cx, cy, size, rotation, kind });
    }
  }
  // Garantiza al menos una forma para que el sigilo nunca quede vacío.
  if (shapes.length === 0) {
    shapes.push({ cx: 48, cy: 48, size: CELL * 0.6, rotation: 45, kind: "square" });
  }
  return shapes;
}

function ShapePath({ shape }: { shape: Shape }) {
  const { cx, cy, size, rotation, kind } = shape;
  const half = size / 2;
  const transform = `rotate(${rotation} ${cx} ${cy})`;
  if (kind === "triangle") {
    const points = `${cx},${cy - half} ${cx + half},${cy + half} ${cx - half},${cy + half}`;
    return <polygon points={points} transform={transform} />;
  }
  if (kind === "square") {
    return (
      <rect
        x={cx - half}
        y={cy - half}
        width={size}
        height={size}
        transform={transform}
      />
    );
  }
  return (
    <line
      x1={cx - half}
      y1={cy}
      x2={cx + half}
      y2={cy}
      transform={transform}
      strokeWidth={Math.max(2, size * 0.14)}
    />
  );
}

export default function Sigil({
  teamId,
  accent,
  size = 32,
  className = "",
}: {
  teamId: string;
  accent: string;
  size?: number;
  className?: string;
}) {
  const shapes = buildShapes(teamId);
  return (
    <svg
      viewBox="0 0 96 96"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <g fill="none" stroke={accent} strokeWidth={3} strokeLinejoin="round">
        {shapes.map((s, i) => (
          <ShapePath key={i} shape={s} />
        ))}
      </g>
    </svg>
  );
}
