import { notFound } from "next/navigation";
import { getPublicMatch } from "@/lib/repo";

export const metadata = {
  robots: { index: false, follow: false },
};

const ESTADO_LABEL: Record<string, string> = {
  programado: "Programado",
  en_vivo: "En vivo",
  finalizado: "Final",
};

export default async function MarcadorPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const match = await getPublicMatch(matchId);
  if (!match) notFound();

  const live = match.estado === "en_vivo";
  const done = match.estado === "finalizado";
  const winner = done ? (match.scoreA > match.scoreB ? "a" : "b") : null;

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-8 bg-void px-6 py-16">
      <div className="grid-bg" aria-hidden />
      <div className="scanline-overlay" aria-hidden />

      <div className="relative z-10 flex flex-col items-center gap-2 text-center">
        <span className="hud-chip">{match.ronda}</span>
        <span className="font-mono text-xs uppercase tracking-widest text-muted">
          {match.formato}
        </span>
      </div>

      <div
        className={`surface relative z-10 flex w-full max-w-4xl flex-col items-stretch gap-0 overflow-hidden ${
          live ? "surface-brand glow-brand" : ""
        }`}
      >
        <TeamRow
          nombre={match.teamANombre}
          tag={match.teamATag}
          score={match.estado === "programado" ? undefined : match.scoreA}
          win={winner === "a"}
        />
        <div className="h-px bg-line/40" />
        <TeamRow
          nombre={match.teamBNombre}
          tag={match.teamBTag}
          score={match.estado === "programado" ? undefined : match.scoreB}
          win={winner === "b"}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-2">
        {live ? (
          <span className="flex items-center gap-2 font-head text-sm uppercase tracking-widest text-brand">
            <span className="h-2 w-2 rounded-full bg-brand anim-flicker" />
            {ESTADO_LABEL.en_vivo}
          </span>
        ) : done ? (
          <span className="font-head text-sm uppercase tracking-widest text-teal">
            {ESTADO_LABEL.finalizado}
          </span>
        ) : (
          <span className="font-head text-sm uppercase tracking-widest text-muted">
            {ESTADO_LABEL.programado}
          </span>
        )}
        {match.fecha && (
          <span className="font-mono text-xs text-muted2">
            {new Date(match.fecha).toLocaleString("es-MX", {
              dateStyle: "long",
              timeStyle: "short",
            })}
          </span>
        )}
      </div>
    </div>
  );
}

function TeamRow({
  nombre,
  tag,
  score,
  win,
}: {
  nombre: string | null;
  tag: string | null;
  score?: number;
  win: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-6 px-8 py-6 ${
        win ? "bg-teal/5" : ""
      }`}
    >
      <div className="min-w-0">
        <div className="font-display truncate text-3xl uppercase tracking-wide text-bone sm:text-5xl">
          {nombre ?? "Por definir"}
        </div>
        {tag && (
          <div className="mt-1 font-mono text-xs uppercase tracking-widest text-muted">
            [{tag}]
          </div>
        )}
      </div>
      <div
        className={`font-display text-5xl sm:text-7xl ${
          win ? "text-teal" : "text-bone-dim"
        }`}
      >
        {score ?? "–"}
      </div>
    </div>
  );
}
