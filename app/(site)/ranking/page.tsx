import type { CSSProperties } from "react";
import { RANKING_CONCEPTS } from "@/lib/data";
import { getRankingStandings, TEAM_ACCENT_HEX, type RankingStanding } from "@/lib/repo";
import { getSession } from "@/lib/session";
import Reveal from "@/components/ui/Reveal";
import CountUp from "@/components/ui/CountUp";
import RankingCalculator from "@/components/ui/RankingCalculator";
import Sparkline from "@/components/ui/Sparkline";
import Sigil from "@/components/ui/Sigil";

function accentHexOf(accent: string): string {
  return TEAM_ACCENT_HEX[accent as keyof typeof TEAM_ACCENT_HEX] ?? "#7E8C99";
}

export const metadata = {
  title: "Ranking Nacional · Copa México VALORANT 2026",
};

export default async function RankingPage() {
  let standings: RankingStanding[] = [];
  let dbError = false;
  try {
    standings = await getRankingStandings();
  } catch {
    dbError = true;
  }
  const lider = standings[0];
  const session = await getSession();
  const ownTeamId = session?.role === "team" ? session.id : null;

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="font-mono text-xs uppercase tracking-[0.3em] text-gold">
        // Ranking Nacional de Equipos · Art. 43
      </div>
      <h1 className="mt-2 font-display text-4xl uppercase sm:text-5xl">
        Ranking nacional
      </h1>
      <p className="mt-3 max-w-2xl text-bone-dim">
        Clasificación acumulada de los últimos 12 meses, calculada en vivo desde
        los resultados oficiales y los ajustes del Comité. No cambia resultados
        ya jugados: mide la fuerza competitiva reciente.
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
            <span><b className="text-bone-dim">Serie ganada</b> · +20 (automático)</span>
            <span><b className="text-bone-dim">Mapa ganado</b> · +8 (automático)</span>
            <span><b className="text-bone-dim">Gran Final</b> · +400 campeón / +260 subcampeón</span>
            <span><b className="text-bone-dim">Ajustes CO</b> · rival superior, consistencia, sanciones</span>
          </div>
        </div>
      </Reveal>

      {/* Tabla de ranking */}
      <section className="mt-12">
        <Reveal>
          <h2 className="font-head text-xl font-semibold uppercase tracking-wide">
            Clasificación vigente
          </h2>
          {lider && (
            <p className="mt-1 text-sm text-muted">
              Líder actual: <span className="text-gold">{lider.nombre}</span> con{" "}
              <CountUp to={lider.puntos} className="font-mono text-gold" /> pts.
            </p>
          )}
        </Reveal>

        {dbError ? (
          <Notice text="No se pudo cargar el ranking (base de datos no disponible)." />
        ) : standings.length === 0 ? (
          <Notice text="Aún no hay resultados oficiales. El ranking aparecerá cuando se jueguen los primeros partidos." />
        ) : (
          <Reveal delay={100} className="mt-5">
            <div className="surface overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="bg-void2 text-left font-head uppercase">
                    <th className="border-b-2 border-gold p-3 text-xs">#</th>
                    <th className="border-b-2 border-gold p-3 text-xs">Equipo</th>
                    <th className="border-b-2 border-gold p-3 text-xs">Rama</th>
                    <th className="border-b-2 border-gold p-3 text-xs">Series</th>
                    <th className="border-b-2 border-gold p-3 text-xs">Mapas</th>
                    <th className="border-b-2 border-gold p-3 text-xs">Dif.</th>
                    <th className="border-b-2 border-gold p-3 text-xs">Bonus pos.</th>
                    <th className="border-b-2 border-gold p-3 text-xs">Ajustes</th>
                    <th className="border-b-2 border-gold p-3 text-xs">Tendencia</th>
                    <th
                      className="border-b-2 border-gold p-3 text-xs"
                      title="Diferencia entre el corte más reciente y el anterior. Con más de 8 eventos de puntuación, el historial se agrupa en 8 cortes; en ese caso el delta compara los dos últimos cortes agrupados, no necesariamente el último partido."
                    >
                      Δ
                    </th>
                    <th className="border-b-2 border-gold p-3 text-xs">Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((r, i) => (
                    <tr
                      key={r.teamId}
                      className={`accent-stripe group border-b border-line/40 transition odd:bg-white/[0.015] hover:bg-teal/[0.04] ${
                        r.teamId === ownTeamId ? "glow-accent" : ""
                      }`}
                      style={{ "--team-accent": accentHexOf(r.accent) } as CSSProperties}
                    >
                      <td className="p-3">
                        <span
                          className={`font-display text-lg ${
                            i === 0
                              ? "text-gold"
                              : i < 3
                                ? "text-bone"
                                : "text-muted"
                          }`}
                        >
                          {i + 1}
                        </span>
                      </td>
                      <td className="p-3">
                        <details className="group/detail">
                          <summary className="flex cursor-pointer list-none items-center gap-2">
                            <Sigil teamId={r.teamId} accent={accentHexOf(r.accent)} size={18} className="shrink-0" />
                            <span className="font-head font-semibold text-bone underline decoration-dotted decoration-muted underline-offset-4">
                              {r.nombre}
                            </span>
                            <span className="font-mono text-xs text-muted">
                              [{r.tag}]
                            </span>
                            <span className="text-[10px] text-muted2 group-open/detail:hidden">
                              ▸ desglose
                            </span>
                          </summary>
                          <div className="mt-2 max-w-xs space-y-1 border-l border-line pl-3 font-mono text-xs text-bone-dim">
                            <p>Series ganadas · +20 c/u = {r.series * 20}</p>
                            <p>Mapas ganados · +8 c/u = {r.mapas * 8}</p>
                            <p>Bonus de posición = {r.bonusPosicion}</p>
                            <p>
                              Ajustes del CO ={" "}
                              {r.ajustes > 0 ? `+${r.ajustes}` : r.ajustes}
                            </p>
                            <a
                              href="/reglamento?art=43"
                              className="inline-block pt-1 text-teal underline decoration-dotted underline-offset-4 hover:text-bone"
                            >
                              Ver Art. 43 →
                            </a>
                          </div>
                        </details>
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
                      <td className="p-3 font-mono text-teal [font-variant-numeric:tabular-nums]">
                        {r.series}
                      </td>
                      <td className="p-3 font-mono text-bone-dim [font-variant-numeric:tabular-nums]">
                        {r.mapas}
                      </td>
                      <td className="p-3 font-mono text-bone-dim [font-variant-numeric:tabular-nums]">
                        {r.difMapas > 0 ? `+${r.difMapas}` : r.difMapas}
                      </td>
                      <td className="p-3 font-mono text-gold [font-variant-numeric:tabular-nums]">
                        {r.bonusPosicion > 0 ? `+${r.bonusPosicion}` : "—"}
                      </td>
                      <td className="p-3">
                        {r.ajustes === 0 ? (
                          <span className="font-mono text-muted2">—</span>
                        ) : (
                          <span
                            className={`font-mono [font-variant-numeric:tabular-nums] ${
                              r.ajustes < 0 ? "text-brand" : "text-teal"
                            }`}
                          >
                            {r.ajustes > 0 ? `+${r.ajustes}` : r.ajustes}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <Sparkline data={r.historial} />
                      </td>
                      <td className="p-3">
                        {r.delta === 0 ? (
                          <span className="font-mono text-muted2">—</span>
                        ) : r.delta > 0 ? (
                          <span className="font-mono text-teal [font-variant-numeric:tabular-nums]">
                            ▲ {r.delta}
                          </span>
                        ) : (
                          <span className="font-mono text-brand [font-variant-numeric:tabular-nums]">
                            ▼ {Math.abs(r.delta)}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="font-mono font-semibold text-bone [font-variant-numeric:tabular-nums]">
                          {r.puntos}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        )}
        <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted">
          Desempate (Art. 43): puntos → series ganadas → dif. de mapas. Ventana:
          12 meses.
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

function Notice({ text }: { text: string }) {
  return (
    <div className="surface clip-corner mt-6 p-6 text-center text-sm text-muted">
      {text}
    </div>
  );
}
