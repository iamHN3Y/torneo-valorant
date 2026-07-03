import { TOURNAMENT, CALENDAR } from "@/lib/data";
import Reveal from "@/components/ui/Reveal";
import CountUp from "@/components/ui/CountUp";
import CyberButton from "@/components/ui/CyberButton";
import TiltCard from "@/components/ui/TiltCard";
import GlitchText from "@/components/ui/GlitchText";
import Accordion, { type AccordionItem } from "@/components/ui/Accordion";

const COMO_PARTICIPAR: AccordionItem[] = [
  {
    step: "01",
    title: "Arma tu equipo",
    body: "Reúne a 5 titulares y hasta 2 suplentes. Elige rama Amateur (tope de 30 puntos de rango) o Élite (sin tope). Necesitas al menos un jugador de nacionalidad mexicana y un capitán que será el único interlocutor con el arbitraje.",
    href: "/reglamento",
    cta: "Ver requisitos (Art. 10–16)",
  },
  {
    step: "02",
    title: "Registra y verifica",
    body: "Completa el formulario de inscripción. El sistema valida tu roster en vivo (puntos, límites por rango y base nacional) y verifica cada Riot ID. Sube tu documentación de identidad y cubre la cuota para asegurar tu cupo.",
    href: "/inscripcion",
    cta: "Ir a inscripción",
  },
  {
    step: "03",
    title: "Compite y escala",
    body: "Pasa por clasificatorias, fase de grupos (GSL) y playoffs de doble eliminación rumbo a la Gran Final Bo5. Cada resultado suma al Ranking Nacional de Equipos y abre la puerta a la Copa América y al Mundial de Naciones.",
    href: "/bracket",
    cta: "Ver competición",
  },
];

export default function Home() {
  const cupoPct = Math.round((TOURNAMENT.inscritos / TOURNAMENT.cupoMax) * 100);

  return (
    <div className="mx-auto max-w-6xl px-5">
      {/* ===================== HERO ===================== */}
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

          <div className="mt-8 flex flex-wrap gap-3">
            <CyberButton href="/inscripcion">Inscribe tu equipo</CyberButton>
            <CyberButton href="#como-participar" variant="ghost">
              ¿Cómo funciona?
            </CyberButton>
          </div>

          {/* Ayuda al usuario nuevo */}
          <p className="mt-5 font-mono text-xs text-muted">
            ¿Primera vez? Te lo explicamos en{" "}
            <a href="#como-participar" className="text-teal hover:text-glow-teal">
              3 pasos
            </a>{" "}
            — sin prisa.
          </p>
        </div>
      </section>

      {/* ===================== ESTADO DEL TORNEO ===================== */}
      <Reveal>
        <section className="grid gap-4 sm:grid-cols-3">
          <TiltCard className="surface clip-corner p-5">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted">
              Cupos ocupados
            </div>
            <div className="mt-2 font-display text-4xl">
              <CountUp to={TOURNAMENT.inscritos} className="text-glow-teal" />
              <span className="text-muted">/{TOURNAMENT.cupoMax}</span>
            </div>
            <div className="meter mt-3 h-2 w-full overflow-hidden rounded bg-void2">
              <span className="bg-teal" style={{ width: `${cupoPct}%` }} />
            </div>
            <div className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted2">
              {cupoPct}% del cupo · {TOURNAMENT.cupoMax - TOURNAMENT.inscritos}{" "}
              lugares libres
            </div>
          </TiltCard>

          <TiltCard className="surface surface-brand clip-corner p-5">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted">
              Formato
            </div>
            <div className="mt-2 font-display text-3xl">5v5 · GSL + Playoffs</div>
            <div className="mt-1 text-sm text-bone-dim">
              Clasificatorias → grupos → doble eliminación → Gran Final Bo5
            </div>
          </TiltCard>

          <TiltCard className="surface clip-corner p-5">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted">
              Servidor competitivo
            </div>
            <div className="mt-2 font-display text-3xl text-glow-teal">
              {TOURNAMENT.servidor}
            </div>
            <div className="mt-1 text-sm text-bone-dim">
              México City / Dallas · UTC−6 (CDMX)
            </div>
          </TiltCard>
        </section>
      </Reveal>

      {/* ===================== CÓMO PARTICIPAR (progressive disclosure) ===================== */}
      <section id="como-participar" className="mt-24 scroll-mt-24">
        <Reveal>
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-brand">
            // Empieza aquí
          </div>
          <h2 className="mt-2 font-display text-4xl uppercase">
            ¿Cómo participar?
          </h2>
          <p className="mt-3 max-w-2xl text-bone-dim">
            Tres pasos, a tu ritmo. Toca cada tarjeta para ver los detalles solo
            cuando los necesites.
          </p>
        </Reveal>
        <Reveal delay={120} className="mt-8">
          <Accordion items={COMO_PARTICIPAR} />
        </Reveal>
      </section>

      {/* ===================== CALENDARIO ===================== */}
      <section className="mt-24">
        <Reveal>
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-brand">
            // Calendario modelo
          </div>
          <h2 className="mt-2 font-display text-4xl uppercase">
            Ruta de la temporada
          </h2>
        </Reveal>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CALENDAR.map((ev, i) => (
            <Reveal key={ev.semana} delay={i * 80}>
              <TiltCard
                max={5}
                className={`surface ${
                  ev.estado === "activo" ? "surface-brand glow-brand" : ""
                } h-full p-5`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-widest text-muted">
                    {ev.semana}
                  </span>
                  {ev.estado === "activo" && (
                    <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-brand">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand anim-flicker" />
                      Activo
                    </span>
                  )}
                </div>
                <div className="mt-2 font-head text-lg font-semibold uppercase tracking-wide text-bone">
                  {ev.titulo}
                </div>
                <p className="mt-1 text-sm text-muted">{ev.detalle}</p>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===================== AVISO LEGAL ===================== */}
      <Reveal className="mt-24">
        <section className="surface surface-brand clip-corner-tl p-6">
          <div className="font-head text-xs font-semibold uppercase tracking-widest text-brand">
            ◆ Aviso · Relación con Riot Games
          </div>
          <p className="mt-2 max-w-3xl text-sm text-bone-dim">
            La Copa México VALORANT 2026 es un torneo comunitario independiente. No
            está afiliada, patrocinada ni avalada por Riot Games, Inc. Se organiza
            bajo la licencia comunitaria de las VALORANT Community Competition
            Guidelines.
          </p>
        </section>
      </Reveal>
    </div>
  );
}
