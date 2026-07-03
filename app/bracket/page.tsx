import { GROUP_A, PLAYOFFS } from "@/lib/data";
import type { Match } from "@/lib/types";
import Reveal from "@/components/ui/Reveal";

export const metadata = {
  title: "Competición · Copa México VALORANT 2026",
};

export default function BracketPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="font-mono text-xs uppercase tracking-[0.3em] text-brand">
        // Flujo de competición
      </div>
      <h1 className="mt-2 font-display text-4xl uppercase sm:text-5xl">
        Brackets y grupos
      </h1>
      <p className="mt-3 max-w-2xl text-bone-dim">
        Visualización del desarrollo del torneo: fase de grupos (GSL) y playoffs
        de doble eliminación rumbo a la Gran Final (Bo5). Datos de ejemplo para
        la demo.
      </p>

      {/* FASE DE GRUPOS */}
      <section className="mt-12">
        <Reveal>
          <h2 className="font-head text-xl font-semibold uppercase tracking-wide">
            Fase de grupos · Grupo A
          </h2>
        </Reveal>
        <Reveal delay={100} className="mt-4">
          <div className="surface overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="bg-void2 text-left font-head uppercase">
                  <th className="border-b-2 border-brand p-3 text-xs">#</th>
                  <th className="border-b-2 border-brand p-3 text-xs">Equipo</th>
                  <th className="border-b-2 border-brand p-3 text-xs">V</th>
                  <th className="border-b-2 border-brand p-3 text-xs">D</th>
                  <th className="border-b-2 border-brand p-3 text-xs">Dif. mapas</th>
                  <th className="border-b-2 border-brand p-3 text-xs">Estado</th>
                </tr>
              </thead>
              <tbody>
                {GROUP_A.map((row) => (
                  <tr
                    key={row.tag}
                    className={`border-b border-line/40 transition odd:bg-white/[0.015] hover:bg-teal/[0.04] ${
                      row.clasificado ? "" : "opacity-70"
                    }`}
                  >
                    <td className="p-3">
                      <span
                        className={`font-display text-lg ${
                          row.clasificado ? "text-teal" : "text-muted"
                        }`}
                      >
                        {row.pos}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="font-head font-semibold text-bone">
                        {row.nombre}
                      </span>
                      <span className="ml-2 font-mono text-xs text-muted">
                        [{row.tag}]
                      </span>
                    </td>
                    <td className="p-3 font-mono text-teal">{row.v}</td>
                    <td className="p-3 font-mono text-brand">{row.d}</td>
                    <td className="p-3 font-mono text-bone-dim">
                      {row.difMapas > 0 ? `+${row.difMapas}` : row.difMapas}
                    </td>
                    <td className="p-3">
                      {row.clasificado ? (
                        <span className="hud-chip text-teal">Clasificado</span>
                      ) : (
                        <span className="hud-chip text-muted">Eliminado</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted2">
          Desempate (Art. 21): head-to-head → dif. mapas → dif. rondas → rondas a
          favor → Bo1.
        </p>
      </section>

      {/* PLAYOFFS */}
      <section className="mt-16">
        <Reveal>
          <h2 className="font-head text-xl font-semibold uppercase tracking-wide">
            Playoffs · Upper bracket
          </h2>
        </Reveal>
        <div className="mt-6 flex gap-6 overflow-x-auto pb-4">
          {Object.entries(PLAYOFFS).map(([ronda, partidas], i) => (
            <Reveal key={ronda} delay={i * 120} className="min-w-[260px] flex-1">
              <div className="mb-3 font-mono text-[11px] uppercase tracking-widest text-muted">
                {ronda}
              </div>
              <div className="flex h-full flex-col justify-around gap-4">
                {partidas.map((m) => (
                  <MatchCard key={m.id} m={m} />
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}

function MatchCard({ m }: { m: Match }) {
  const live = m.estado === "en_vivo";
  const estadoBadge = {
    programado: <span className="text-muted">Programado</span>,
    en_vivo: (
      <span className="flex items-center gap-1.5 text-brand">
        <span className="h-1.5 w-1.5 rounded-full bg-brand anim-flicker" />
        En vivo
      </span>
    ),
    finalizado: <span className="text-teal">Final</span>,
  }[m.estado];

  return (
    <div className={`surface ${live ? "surface-brand glow-brand" : ""}`}>
      <div className="flex items-center justify-between border-b border-line/50 px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wider">
          {m.formato}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wider">
          {estadoBadge}
        </span>
      </div>
      <TeamLine team={m.a?.nombre} tag={m.a?.tag} score={m.a?.score} win={m.ganador === "a"} />
      <div className="h-px bg-line/40" />
      <TeamLine team={m.b?.nombre} tag={m.b?.tag} score={m.b?.score} win={m.ganador === "b"} />
      {m.fecha && (
        <div className="border-t border-line/50 px-3 py-1.5 font-mono text-[10px] text-muted">
          {m.fecha}
        </div>
      )}
    </div>
  );
}

function TeamLine({
  team,
  tag,
  score,
  win,
}: {
  team?: string;
  tag?: string;
  score?: number;
  win?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between px-3 py-2 ${
        win ? "bg-teal/5" : ""
      }`}
    >
      <span
        className={`truncate text-sm ${
          win ? "font-semibold text-bone" : "text-bone-dim"
        }`}
      >
        {team ?? "Por definir"}
        {tag && tag !== "—" && (
          <span className="ml-1 font-mono text-[10px] text-muted">[{tag}]</span>
        )}
      </span>
      <span
        className={`font-display text-lg ${
          win ? "text-teal text-glow-teal" : "text-muted"
        }`}
      >
        {score ?? "–"}
      </span>
    </div>
  );
}
