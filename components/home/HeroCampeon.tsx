import GlitchText from "@/components/ui/GlitchText";
import CyberButton from "@/components/ui/CyberButton";

export interface Campeon {
  nombre: string;
  tag: string;
}

/** Hero de la Home cuando el torneo (activo o el último) ya finalizó. */
export default function HeroCampeon({ campeon }: { campeon: Campeon | null }) {
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
        <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.35em] text-gold">
          <span className="inline-block h-2 w-2 rounded-full bg-gold anim-flicker" />
          Torneo finalizado
          <span className="h-px flex-1 bg-line" />
        </div>

        {campeon ? (
          <>
            <h1 className="mt-6 font-display text-[clamp(2.4rem,8vw,6rem)] uppercase leading-[0.88] break-words">
              <GlitchText text="Campeón" />
            </h1>
            <div className="glow-gold mt-4 inline-flex items-baseline gap-3 border border-gold/50 bg-gold/10 px-4 py-2">
              <span className="font-display text-3xl text-gold">{campeon.nombre}</span>
              <span className="font-mono text-sm text-bone-dim">[{campeon.tag}]</span>
            </div>
            <p className="mt-6 max-w-xl text-lg text-bone-dim">
              La Copa México VALORANT 2026 concluyó su edición. Gracias a todos
              los equipos que compitieron rumbo a la Gran Final.
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-6 font-display text-[clamp(2.4rem,8vw,6rem)] uppercase leading-[0.88] break-words">
              Torneo <GlitchText text="finalizado" />
            </h1>
            <p className="mt-6 max-w-xl text-lg text-bone-dim">
              Esta edición de la Copa México VALORANT concluyó. Consulta el
              bracket y el ranking para revisar los resultados finales.
            </p>
          </>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <CyberButton href="/bracket">Ver resultados finales</CyberButton>
          <CyberButton href="/ranking" variant="ghost">
            Ver ranking
          </CyberButton>
        </div>
      </div>
    </section>
  );
}
