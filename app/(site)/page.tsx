import { TOURNAMENT as FALLBACK, CALENDAR } from "@/lib/data";
import {
  getActiveTournament,
  getLastFinishedTournament,
  getHomeSignal,
  getNextMatchForTeam,
  getBracketMatches,
  type DbTournament,
  type DbMatch,
  type HomeSignal,
} from "@/lib/repo";
import { getSession } from "@/lib/session";
import Reveal from "@/components/ui/Reveal";
import CountUp from "@/components/ui/CountUp";
import TiltCard from "@/components/ui/TiltCard";
import GlitchText from "@/components/ui/GlitchText";
import Accordion, { type AccordionItem } from "@/components/ui/Accordion";
import Marquee from "@/components/ui/Marquee";
import LiveRefresher from "@/components/ui/LiveRefresher";
import HeroConvocatoria from "@/components/home/HeroConvocatoria";
import HeroJornada from "@/components/home/HeroJornada";
import HeroCampeon, { type Campeon } from "@/components/home/HeroCampeon";
import ProximaMision from "@/components/home/ProximaMision";

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

/** Normaliza texto para comparar nombres de ronda (sin acentos, minúsculas). */
function normRonda(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

type EstadoHome =
  | "sin_bd"
  | "sin_torneo"
  | "inscripciones"
  | "en_curso_sin_vivo"
  | "en_curso_en_vivo"
  | "finalizado";

export default async function Home() {
  let estadoHome: EstadoHome = "sin_bd";
  let tour: DbTournament | null = null;
  let signal: HomeSignal | null = null;
  let campeon: Campeon | null = null;
  let nextMatchTeam: DbMatch | null = null;
  let teamId: string | null = null;

  try {
    const session = await getSession();
    if (session?.role === "team") teamId = session.id;

    tour = await getActiveTournament();
    if (tour) {
      estadoHome = tour.estado === "inscripciones" ? "inscripciones" : "en_curso_sin_vivo";
    } else {
      const finished = await getLastFinishedTournament();
      if (finished) {
        tour = finished;
        estadoHome = "finalizado";
      } else {
        estadoHome = "sin_torneo";
      }
    }

    if (tour) {
      signal = await getHomeSignal(tour.id);
      if (estadoHome === "en_curso_sin_vivo" && signal.liveMatch) {
        estadoHome = "en_curso_en_vivo";
      }
      if (estadoHome === "finalizado") {
        const bracket = await getBracketMatches(tour.id);
        const finalMatch = bracket.find((m) => {
          if (m.estado !== "finalizado") return false;
          const r = normRonda(m.ronda);
          return r.includes("gran final") || r === "final";
        });
        if (finalMatch) {
          const winner =
            finalMatch.scoreA > finalMatch.scoreB
              ? { nombre: finalMatch.teamANombre, tag: finalMatch.teamATag }
              : { nombre: finalMatch.teamBNombre, tag: finalMatch.teamBTag };
          if (winner.nombre && winner.tag) {
            campeon = { nombre: winner.nombre, tag: winner.tag };
          }
        }
      }
      if (teamId) {
        nextMatchTeam = await getNextMatchForTeam(teamId);
      }
    }
  } catch {
    // Sin BD configurada (o falla a mitad de camino tras obtener el
    // torneo): se muestra el estado "sin_bd" y se descarta cualquier dato
    // parcial para no mezclar "no disponible" con cifras a medias.
    estadoHome = "sin_bd";
    tour = null;
    signal = null;
  }

  const cupoMax = tour?.cupoMax ?? FALLBACK.cupoMax;
  const servidor = tour?.servidor ?? FALLBACK.servidor;
  const inscritos = signal?.inscritos ?? 0;
  const cupoPct = cupoMax > 0 ? Math.round((inscritos / cupoMax) * 100) : 0;
  const gratuito = Boolean(tour?.gratuito) && estadoHome === "inscripciones";
  const hayPartidoEnVivo = estadoHome === "en_curso_en_vivo";
  const equiposMarquee = signal?.equipos ?? [];

  return (
    <div className="mx-auto max-w-6xl px-5">
      {/* Piso lento de refresco en TODOS los estados (incluidos sin_bd,
          sin_torneo y finalizado): así se detecta que la BD volvió o que se
          creó/activó un torneo sin que el usuario tenga que recargar. */}
      <LiveRefresher hayPartidoEnVivo={hayPartidoEnVivo} />

      {/* ===================== HERO (condicional por estado) ===================== */}
      {estadoHome === "sin_bd" || estadoHome === "sin_torneo" ? (
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
            <div className="surface clip-corner mt-6 max-w-xl p-6 text-sm text-muted">
              {estadoHome === "sin_bd"
                ? "No se pudo cargar el estado del torneo (base de datos no disponible)."
                : "Aún no hay un torneo activo ni resultados previos. Vuelve pronto para conocer la próxima edición."}
            </div>
          </div>
        </section>
      ) : estadoHome === "inscripciones" ? (
        <HeroConvocatoria gratuito={gratuito} />
      ) : estadoHome === "finalizado" ? (
        <HeroCampeon campeon={campeon} />
      ) : (
        <HeroJornada liveMatch={signal?.liveMatch ?? null} nextMatch={signal?.nextMatch ?? null} />
      )}

      {/* ===================== MARQUEE DE EQUIPOS INSCRITOS ===================== */}
      {equiposMarquee.length >= 3 && (
        <Reveal>
          <Marquee items={equiposMarquee.map((e) => `${e.nombre} [${e.tag}]`)} />
        </Reveal>
      )}

      {/* ===================== TU PRÓXIMA MISIÓN (solo equipos con sesión) ===================== */}
      {teamId && <ProximaMision match={nextMatchTeam} teamId={teamId} />}

      {/* ===================== ESTADO DEL TORNEO ===================== */}
      {tour && (
        <Reveal className="mt-16">
          <section aria-labelledby="estado-torneo" className="grid gap-4 sm:grid-cols-3">
            <h2 id="estado-torneo" className="sr-only">
              Estado del torneo
            </h2>
            <TiltCard className="surface clip-corner p-5">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted">
                Cupos ocupados
              </div>
              <div className="mt-2 font-display text-4xl">
                <CountUp to={inscritos} className="text-glow-teal" />
                <span className="text-muted">/{cupoMax}</span>
              </div>
              <div
                className="meter mt-3 h-2 w-full overflow-hidden rounded bg-void2"
                role="progressbar"
                aria-valuenow={cupoPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Cupos ocupados: ${cupoPct} por ciento`}
              >
                <span className="bg-teal" style={{ width: `${cupoPct}%` }} />
              </div>
              <div className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted">
                {cupoPct}% del cupo · {Math.max(cupoMax - inscritos, 0)} lugares
                libres
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
                {servidor}
              </div>
              <div className="mt-1 text-sm text-bone-dim">
                México City / Dallas · UTC−6 (CDMX)
              </div>
            </TiltCard>
          </section>
        </Reveal>
      )}

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
