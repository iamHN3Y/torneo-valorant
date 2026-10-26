import type { CSSProperties } from "react";
import Link from "next/link";
import {
  getActiveTournament,
  getGroupsWithStandings,
  getGroupsWithTeams,
  getBracketMatches,
  TEAM_ACCENT_HEX,
  type DbMatch,
  type GroupWithStandings,
} from "@/lib/repo";
import Reveal from "@/components/ui/Reveal";
import Sigil from "@/components/ui/Sigil";

function accentHexOf(accent: string | null): string {
  return TEAM_ACCENT_HEX[accent as keyof typeof TEAM_ACCENT_HEX] ?? "#7E8C99";
}

export const metadata = {
  title: "Competición · Copa México VALORANT 2026",
};

export default async function BracketPage() {
  let groups: GroupWithStandings[] = [];
  let matches: DbMatch[] = [];
  let dbError = false;
  let noTournament = false;
  let sorteoPendiente = false;
  let gruposFormados = 0;

  try {
    const tour = await getActiveTournament();
    if (!tour) {
      noTournament = true;
    } else if (!tour.sorteoPublicadoAt) {
      // Sorteo (Fase 6): mientras no esté publicado, NO se llama a
      // getGroupsWithStandings (que revelaría qué equipo está en qué
      // grupo). Solo se cuentan los grupos formados para dar contexto.
      const rawGroups = await getGroupsWithTeams(tour.id);
      gruposFormados = rawGroups.length;
      if (gruposFormados > 0) sorteoPendiente = true;
      matches = await getBracketMatches(tour.id);
    } else {
      [groups, matches] = await Promise.all([
        getGroupsWithStandings(tour.id),
        getBracketMatches(tour.id),
      ]);
    }
  } catch {
    dbError = true;
  }

  // Agrupar partidos de playoffs por ronda, preservando orden.
  const rondas: { ronda: string; partidas: DbMatch[] }[] = [];
  for (const m of matches) {
    let bucket = rondas.find((r) => r.ronda === m.ronda);
    if (!bucket) {
      bucket = { ronda: m.ronda, partidas: [] };
      rondas.push(bucket);
    }
    bucket.partidas.push(m);
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="font-mono text-xs uppercase tracking-[0.3em] text-brand">
        // Flujo de competición
      </div>
      <h1 className="mt-2 font-display text-4xl uppercase sm:text-5xl">
        Brackets y grupos
      </h1>
      <p className="mt-3 max-w-2xl text-bone-dim">
        Fase de grupos (GSL) y playoffs de doble eliminación rumbo a la Gran
        Final (Bo5). Las posiciones se calculan en vivo desde los resultados.
      </p>

      {dbError ? (
        <Notice text="No se pudo cargar la competición (base de datos no disponible)." />
      ) : noTournament ? (
        <Notice text="Aún no hay un torneo activo. El bracket aparecerá cuando el Comité abra la competición." />
      ) : (
        <>
          {/* FASE DE GRUPOS */}
          <section className="mt-12">
            <Reveal>
              <h2 className="font-head text-xl font-semibold uppercase tracking-wide">
                Fase de grupos
              </h2>
            </Reveal>
            {sorteoPendiente ? (
              <div className="surface clip-corner mt-6 p-6 text-center">
                <p className="text-sm text-muted">
                  {gruposFormados} {gruposFormados === 1 ? "grupo formado" : "grupos formados"},
                  sorteo por publicar.
                </p>
                <Link
                  href="/bracket/sorteo"
                  className="mt-3 inline-block font-head text-xs uppercase tracking-wide text-teal transition hover:text-teal/80"
                >
                  Ver estado del sorteo →
                </Link>
              </div>
            ) : groups.length === 0 ? (
              <Notice text="El Comité todavía no ha formado los grupos." small />
            ) : (
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                {groups.map((g, i) => (
                  <Reveal key={g.id} delay={i * 90}>
                    <GroupTable group={g} />
                  </Reveal>
                ))}
              </div>
            )}
            <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted">
              Desempate (Art. 21): head-to-head → dif. mapas → dif. rondas →
              rondas a favor → Bo1.
            </p>
          </section>

          {/* PLAYOFFS */}
          <section className="mt-16">
            <Reveal>
              <h2 className="font-head text-xl font-semibold uppercase tracking-wide">
                Playoffs
              </h2>
            </Reveal>
            {rondas.length === 0 ? (
              <Notice text="Los playoffs se publicarán al cerrar la fase de grupos." small />
            ) : (
              <div className="mt-6 flex gap-6 overflow-x-auto pb-4">
                {rondas.map((r, i) => (
                  <Reveal key={r.ronda} delay={i * 120} className="min-w-[260px] flex-1">
                    <div className="mb-3 font-mono text-[11px] uppercase tracking-widest text-muted">
                      {r.ronda}
                    </div>
                    <div className="flex h-full flex-col justify-around gap-4">
                      {r.partidas.map((m) => (
                        <MatchCard key={m.id} m={m} />
                      ))}
                    </div>
                  </Reveal>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Notice({ text, small }: { text: string; small?: boolean }) {
  return (
    <div
      className={`surface clip-corner ${small ? "mt-6" : "mt-8"} p-6 text-center text-sm text-muted`}
    >
      {text}
    </div>
  );
}

function GroupTable({ group }: { group: GroupWithStandings }) {
  const sinPartidos = group.standings.every((s) => s.jugados === 0);
  return (
    <div className="surface overflow-x-auto">
      <div className="border-b border-line/60 bg-void2 px-4 py-2 font-head text-sm font-semibold uppercase tracking-wide">
        Grupo {group.nombre}
      </div>
      <table className="w-full min-w-[420px] text-sm">
        <thead>
          <tr className="text-left font-head uppercase">
            <th className="p-3 text-xs text-muted">#</th>
            <th className="p-3 text-xs text-muted">Equipo</th>
            <th className="p-3 text-xs text-muted">V</th>
            <th className="p-3 text-xs text-muted">D</th>
            <th className="p-3 text-xs text-muted">Dif</th>
            <th className="p-3 text-xs text-muted">Estado</th>
          </tr>
        </thead>
        <tbody>
          {group.standings.map((row, i) => (
            <tr
              key={row.teamId}
              className={`accent-stripe border-t border-line/40 transition hover:bg-teal/[0.04] ${
                row.clasificado ? "" : "opacity-80"
              }`}
              style={{ "--team-accent": accentHexOf(row.accent) } as CSSProperties}
            >
              <td className="p-3">
                <span
                  className={`font-display text-lg ${
                    row.clasificado ? "text-teal" : "text-muted"
                  }`}
                >
                  {i + 1}
                </span>
              </td>
              <td className="p-3">
                <span className="inline-flex items-center gap-2">
                  <Sigil teamId={row.teamId} accent={accentHexOf(row.accent)} size={20} />
                  <span className="font-head font-semibold text-bone">
                    {row.nombre}
                  </span>
                  <span className="font-mono text-xs text-muted">[{row.tag}]</span>
                </span>
              </td>
              <td className="p-3 font-mono text-teal">{row.v}</td>
              <td className="p-3 font-mono text-brand">{row.d}</td>
              <td className="p-3 font-mono text-bone-dim">
                {row.difMapas > 0 ? `+${row.difMapas}` : row.difMapas}
              </td>
              <td className="p-3">
                {sinPartidos ? (
                  <span className="hud-chip text-muted">Por jugar</span>
                ) : row.clasificado ? (
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
  );
}

function MatchCard({ m }: { m: DbMatch }) {
  const live = m.estado === "en_vivo";
  const done = m.estado === "finalizado";
  const winner = done ? (m.scoreA > m.scoreB ? "a" : "b") : null;

  const estadoBadge =
    m.estado === "programado" ? (
      <span className="text-muted">Programado</span>
    ) : live ? (
      <span className="flex items-center gap-1.5 text-brand">
        <span className="h-1.5 w-1.5 rounded-full bg-brand anim-flicker" />
        En vivo
      </span>
    ) : (
      <span className="text-teal">Final</span>
    );

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
      <TeamLine
        teamId={m.teamAId}
        nombre={m.teamANombre}
        tag={m.teamATag}
        accent={m.teamAAccent}
        score={m.estado === "programado" ? undefined : m.scoreA}
        win={winner === "a"}
      />
      <div className="h-px bg-line/40" />
      <TeamLine
        teamId={m.teamBId}
        nombre={m.teamBNombre}
        tag={m.teamBTag}
        accent={m.teamBAccent}
        score={m.estado === "programado" ? undefined : m.scoreB}
        win={winner === "b"}
      />
      {m.fecha && (
        <div className="border-t border-line/50 px-3 py-1.5 font-mono text-[10px] text-muted">
          {new Date(m.fecha).toLocaleString("es-MX", {
            dateStyle: "short",
            timeStyle: "short",
          })}
        </div>
      )}
    </div>
  );
}

function TeamLine({
  teamId,
  nombre,
  tag,
  accent,
  score,
  win,
}: {
  teamId: string | null;
  nombre: string | null;
  tag: string | null;
  accent: string | null;
  score?: number;
  win?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between px-3 py-2 ${win ? "bg-teal/5" : ""} ${
        teamId ? "accent-stripe" : ""
      }`}
      style={teamId ? ({ "--team-accent": accentHexOf(accent) } as CSSProperties) : undefined}
    >
      <span
        className={`flex min-w-0 items-center gap-1.5 truncate text-sm ${
          win ? "font-semibold text-bone" : "text-bone-dim"
        }`}
      >
        {teamId && (
          <Sigil teamId={teamId} accent={accentHexOf(accent)} size={16} className="shrink-0" />
        )}
        <span className="truncate">{nombre ?? "Por definir"}</span>
        {tag && <span className="font-mono text-[10px] text-muted">[{tag}]</span>}
      </span>
      <span
        className={`font-display text-lg ${win ? "text-teal text-glow-teal" : "text-muted"}`}
      >
        {score ?? "–"}
      </span>
    </div>
  );
}
