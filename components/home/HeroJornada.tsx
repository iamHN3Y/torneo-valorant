import GlitchText from "@/components/ui/GlitchText";
import CyberButton from "@/components/ui/CyberButton";
import type { DbMatch } from "@/lib/repo";

function fecha(f: string | null) {
  if (!f) return "Fecha por confirmar";
  return new Date(f).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" });
}

/** Hero de la Home cuando el torneo está en curso (con o sin partido en vivo). */
export default function HeroJornada({
  liveMatch,
  nextMatch,
}: {
  liveMatch: DbMatch | null;
  nextMatch: DbMatch | null;
}) {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="hero-sweep" aria-hidden />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 top-0 select-none font-display text-[26vw] leading-none text-bone/[0.03] anim-flicker"
      >
        CMX
      </div>

      <div className="relative">
        <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.35em] text-brand">
          <span className="inline-block h-2 w-2 rounded-full bg-brand anim-flicker" />
          Torneo en curso · Copa México VALORANT 2026
          <span className="h-px flex-1 bg-line" />
        </div>

        <h1 className="mt-6 font-display text-[clamp(2.4rem,8vw,5.5rem)] uppercase leading-[0.9] break-words">
          <GlitchText text="La jornada" /> está en marcha
        </h1>

        {liveMatch ? (
          <div className="surface surface-brand glow-brand clip-corner mt-8 max-w-xl p-6">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-brand">
              <span className="h-2 w-2 rounded-full bg-brand anim-flicker" />
              En vivo ahora
            </div>
            <div className="mt-3 flex items-center justify-between gap-4">
              <span className="truncate font-head text-lg font-semibold text-bone">
                {liveMatch.teamANombre ?? "Por definir"}{" "}
                {liveMatch.teamATag && (
                  <span className="font-mono text-xs text-muted">[{liveMatch.teamATag}]</span>
                )}
              </span>
              <span className="font-display text-2xl text-teal">{liveMatch.scoreA}</span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-4">
              <span className="truncate font-head text-lg font-semibold text-bone">
                {liveMatch.teamBNombre ?? "Por definir"}{" "}
                {liveMatch.teamBTag && (
                  <span className="font-mono text-xs text-muted">[{liveMatch.teamBTag}]</span>
                )}
              </span>
              <span className="font-display text-2xl text-teal">{liveMatch.scoreB}</span>
            </div>
            <div className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted">
              {liveMatch.ronda} · {liveMatch.formato}
            </div>
          </div>
        ) : nextMatch ? (
          <div className="surface clip-corner mt-8 max-w-xl p-6">
            <div className="font-mono text-xs uppercase tracking-widest text-teal">
              Próximo partido
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="truncate font-head text-lg font-semibold text-bone">
                {nextMatch.teamANombre ?? "Por definir"}
              </span>
              <span className="shrink-0 font-mono text-xs text-muted">vs</span>
              <span className="truncate text-right font-head text-lg font-semibold text-bone">
                {nextMatch.teamBNombre ?? "Por definir"}
              </span>
            </div>
            <div className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted">
              {nextMatch.ronda} · {nextMatch.formato} · {fecha(nextMatch.fecha)}
            </div>
          </div>
        ) : (
          <p className="mt-8 max-w-xl text-lg text-bone-dim">
            La competición está activa. El próximo cruce se publicará en cuanto
            el Comité lo programe.
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <CyberButton href="/bracket">Ver bracket completo</CyberButton>
          <CyberButton href="/ranking" variant="ghost">
            Ver ranking
          </CyberButton>
        </div>
      </div>
    </section>
  );
}
