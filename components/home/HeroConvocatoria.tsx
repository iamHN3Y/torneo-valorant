import GlitchText from "@/components/ui/GlitchText";
import CyberButton from "@/components/ui/CyberButton";

/** Hero de la Home cuando el torneo está en fase de inscripciones. */
export default function HeroConvocatoria({ gratuito }: { gratuito: boolean }) {
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
          Reglamento oficial · Competición nacional
          <span className="h-px flex-1 bg-line" />
        </div>

        <h1 className="mt-6 font-display text-[clamp(2.6rem,10vw,7rem)] uppercase leading-[0.85] break-words">
          <GlitchText text="Copa" />
          <span className="text-brand text-glow-brand">/</span>
          <GlitchText text="México" />
          <br />
          VALORANT{" "}
          <span className="text-transparent [-webkit-text-stroke:1.5px_var(--color-bone)] sm:[-webkit-text-stroke:2px_var(--color-bone)]">
            2026
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-lg text-bone-dim">
          Torneo comunitario nacional, abierto y con proyección internacional.
          Registra tu equipo, sigue los brackets en vivo y escala el ranking
          nacional rumbo a la Copa América.
        </p>

        {gratuito && (
          <div className="mt-6 inline-flex items-center gap-2 border border-teal/50 bg-teal/10 px-3 py-1.5 font-head text-xs font-bold uppercase tracking-wider text-teal glow-teal">
            <span className="h-1.5 w-1.5 rounded-full bg-teal" />
            Inscripción gratuita en esta edición
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <CyberButton href="/inscripcion">Inscribe tu equipo</CyberButton>
          <CyberButton href="#como-participar" variant="ghost">
            ¿Cómo funciona?
          </CyberButton>
        </div>

        <p className="mt-5 font-mono text-xs text-muted">
          ¿Primera vez? Te lo explicamos en{" "}
          <a href="#como-participar" className="text-teal hover:text-glow-teal">
            3 pasos
          </a>{" "}
          — sin prisa.
        </p>
      </div>
    </section>
  );
}
