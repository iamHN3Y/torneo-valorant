import { RANKING, RANKING_CONCEPTS } from "@/lib/data";
import Reveal from "@/components/ui/Reveal";
import CountUp from "@/components/ui/CountUp";
import RankingCalculator from "@/components/ui/RankingCalculator";

export const metadata = {
  title: "Ranking Nacional · Copa México VALORANT 2026",
};

function Delta({ value }: { value: number }) {
  if (value === 0)
    return <span className="font-mono text-xs text-muted2">—</span>;
  const up = value > 0;
  return (
    <span
      className={`font-mono text-xs ${up ? "text-teal" : "text-brand"}`}
      title={up ? "Sube puestos" : "Baja puestos"}
    >
      {up ? "▲" : "▼"} {Math.abs(value)}
    </span>
  );
}

export default function RankingPage() {
  const lider = RANKING[0];

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="font-mono text-xs uppercase tracking-[0.3em] text-gold">
        // Ranking Nacional de Equipos · Art. 43
      </div>
      <h1 className="mt-2 font-display text-4xl uppercase sm:text-5xl">
        Ranking nacional
      </h1>
      <p className="mt-3 max-w-2xl text-bone-dim">
        Clasificación acumulada de los últimos 12 meses. Mide la fuerza
        competitiva reciente de cada equipo para sembrados, invitaciones y cupos
        — no cambia resultados ya jugados.
      </p>

      {/* Fórmula */}
      <Reveal className="mt-8">
        <div className="surface clip-corner-tl glow-gold p-5 font-mono">
          <div className="text-[10px] uppercase tracking-[0.28em] text-gold">
            // Fórmula de ranking
          </div>
          <div className="mt-3 text-lg font-semibold text-bone">
            PR = Base + Fase + Rival + Bonus −{" "}
            <span className="text-brand">Penalización</span>
          </div>
          <div className="mt-3 grid gap-1 text-xs text-muted sm:grid-cols-2">
            <span><b className="text-bone-dim">Base</b> · posición final alcanzada</span>
            <span><b className="text-bone-dim">Fase</b> · avance competitivo</span>
            <span><b className="text-bone-dim">Rival</b> · vencer a equipos superiores</span>
            <span><b className="text-bone-dim">Bonus</b> · desempeño verificable</span>
          </div>
        </div>
      </Reveal>

      {/* Tabla de ranking */}
      <section className="mt-12">
        <Reveal>
          <h2 className="font-head text-xl font-semibold uppercase tracking-wide">
            Clasificación vigente
          </h2>
          <p className="mt-1 text-sm text-muted">
            Líder actual: <span className="text-gold">{lider.nombre}</span> con{" "}
            <CountUp to={lider.puntos} className="font-mono text-gold" /> pts.
          </p>
        </Reveal>

        <Reveal delay={100} className="mt-5">
          <div className="surface overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="bg-void2 text-left font-head uppercase">
                  <th className="border-b-2 border-gold p-3 text-xs">#</th>
                  <th className="border-b-2 border-gold p-3 text-xs">Equipo</th>
                  <th className="border-b-2 border-gold p-3 text-xs">Rama</th>
                  <th className="border-b-2 border-gold p-3 text-xs">Puntos</th>
                  <th className="border-b-2 border-gold p-3 text-xs">Mov.</th>
                  <th className="border-b-2 border-gold p-3 text-xs">Series</th>
                  <th className="border-b-2 border-gold p-3 text-xs">Dif. mapas</th>
                  <th className="border-b-2 border-gold p-3 text-xs">Reciente</th>
                </tr>
              </thead>
              <tbody>
                {RANKING.map((r) => (
                  <tr
                    key={r.tag}
                    className="group border-b border-line/40 transition odd:bg-white/[0.015] hover:bg-teal/[0.04]"
                  >
                    <td className="p-3">
                      <span
                        className={`font-display text-lg ${
                          r.pos === 1
                            ? "text-gold text-glow-teal"
                            : r.pos <= 3
                              ? "text-bone"
                              : "text-muted"
                        }`}
                      >
                        {r.pos}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="font-head font-semibold text-bone">
                        {r.nombre}
                      </span>
                      <span className="ml-2 font-mono text-xs text-muted">
                        [{r.tag}]
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`font-head text-xs uppercase ${
                          r.rama === "elite" ? "text-gold" : "text-bone-dim"
                        }`}
                      >
                        {r.rama}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="font-mono font-semibold text-bone">
                        {r.puntos}
                      </span>
                    </td>
                    <td className="p-3">
                      <Delta value={r.delta} />
                    </td>
                    <td className="p-3 font-mono text-teal">{r.series}</td>
                    <td className="p-3 font-mono text-bone-dim">
                      {r.difMapas > 0 ? `+${r.difMapas}` : r.difMapas}
                    </td>
                    <td className="p-3">
                      <span className="hud-chip">{r.ultimo}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted2">
          Desempate (Art. 43): resultado más reciente → series ganadas → dif. de
          mapas → menos sanciones → decisión del CO.
        </p>
      </section>

      {/* Calculadora */}
      <section className="mt-14">
        <Reveal>
          <h2 className="font-head text-xl font-semibold uppercase tracking-wide">
            ¿Cuántos puntos sumaría tu equipo?
          </h2>
          <p className="mt-1 text-sm text-muted">
            Juega con los valores y mira el estimado al instante.
          </p>
        </Reveal>
        <Reveal delay={100} className="mt-5">
          <RankingCalculator />
        </Reveal>
      </section>

      {/* Tabla de conceptos */}
      <section className="mt-14">
        <Reveal>
          <h2 className="font-head text-xl font-semibold uppercase tracking-wide">
            Cómo se otorgan los puntos
          </h2>
        </Reveal>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {RANKING_CONCEPTS.map((c, i) => (
            <Reveal key={c.concepto} delay={i * 50}>
              <div
                className={`surface h-full p-4 ${
                  c.tipo === "pen" ? "surface-brand" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-head text-sm font-semibold uppercase tracking-wide text-bone">
                    {c.concepto}
                  </span>
                  <span
                    className={`font-display text-xl ${
                      c.tipo === "pen"
                        ? "text-brand"
                        : c.tipo === "pos"
                          ? "text-gold"
                          : "text-teal"
                    }`}
                  >
                    {c.puntos}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">{c.condicion}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
