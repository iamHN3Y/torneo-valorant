"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import ScrambleText from "@/components/ui/ScrambleText";
import type { GroupWithTeams } from "@/lib/repo";

const STAGGER_MS = 80;
const BASE_DELAY_MS = 250;

interface SequenceItem {
  key: string;
  kind: "header" | "team";
  groupId: string;
}

function buildSequence(groups: GroupWithTeams[]): SequenceItem[] {
  const seq: SequenceItem[] = [];
  for (const g of groups) {
    seq.push({ key: `h:${g.id}`, kind: "header", groupId: g.id });
    for (const t of g.teams) {
      seq.push({ key: `t:${g.id}:${t.id}`, kind: "team", groupId: g.id });
    }
  }
  return seq;
}

/**
 * Dramatización de la revelación de grupos ya publicados (Fase 6). Los
 * datos son públicos desde que el CO publicó el sorteo: esto es solo una
 * puesta en escena reproducible bajo demanda, no un mecanismo de ocultar
 * información.
 *
 * Fallback sin JS garantizado: la lista completa (HTML plano) SIEMPRE está
 * en el marcado, visible por defecto. Solo se oculta visualmente cuando el
 * cliente "arma" la animación (mismo patrón defensivo que Reveal.tsx).
 */
export default function DrawShow({ groups }: { groups: GroupWithTeams[] }) {
  const sequence = useRef(buildSequence(groups)).current;
  const [armed, setArmed] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [playing, setPlaying] = useState(false);
  const timeouts = useRef<number[]>([]);

  function clearTimers() {
    timeouts.current.forEach((id) => window.clearTimeout(id));
    timeouts.current = [];
  }

  useEffect(() => clearTimers, []);

  function reveal(instant: boolean) {
    clearTimers();
    setArmed(true);
    if (instant || prefersReducedMotion()) {
      setRevealed(new Set(sequence.map((s) => s.key)));
      setPlaying(false);
      return;
    }
    setRevealed(new Set());
    setPlaying(true);
    sequence.forEach((item, i) => {
      const id = window.setTimeout(() => {
        setRevealed((prev) => {
          const next = new Set(prev);
          next.add(item.key);
          return next;
        });
        if (i === sequence.length - 1) setPlaying(false);
      }, BASE_DELAY_MS + i * STAGGER_MS);
      timeouts.current.push(id);
    });
  }

  function skip() {
    clearTimers();
    setArmed(true);
    setRevealed(new Set(sequence.map((s) => s.key)));
    setPlaying(false);
  }

  if (groups.length === 0) return null;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => reveal(false)}
          disabled={playing}
          className="cyber-btn cyber-btn-primary text-xs disabled:opacity-40"
        >
          {playing ? "Revelando…" : "▶ Reproducir sorteo"}
        </button>
        {armed && (
          <button
            onClick={skip}
            disabled={!playing}
            className="border border-line px-3 py-2 font-head text-xs uppercase text-bone-dim transition hover:border-teal hover:text-teal disabled:opacity-40"
          >
            Saltar
          </button>
        )}
      </div>

      {/* Fallback sin JS garantizado: lista plana, siempre en el marcado.
          Se oculta visualmente sólo cuando la animación se arma. */}
      <div
        data-hidden={armed ? "true" : undefined}
        className="sorteo-fallback mt-6 grid gap-6 sm:grid-cols-2"
      >
        {groups.map((g) => (
          <div key={g.id} className="surface p-4">
            <div className="font-head text-sm font-semibold uppercase tracking-wide">
              Grupo {g.nombre}
            </div>
            <ul className="mt-3 space-y-1.5">
              {g.teams.length === 0 && (
                <li className="text-sm text-muted2">Sin equipos asignados.</li>
              )}
              {g.teams.map((t) => (
                <li
                  key={t.id}
                  className="border border-line/60 px-3 py-1.5 text-sm text-bone"
                >
                  {t.nombre}{" "}
                  <span className="font-mono text-xs text-muted">[{t.tag}]</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Capa animada: sólo montada/visible cuando la animación está armada. */}
      {armed && (
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {groups.map((g) => {
            const headerRevealed = revealed.has(`h:${g.id}`);
            return (
              <div
                key={g.id}
                className={`surface p-4 transition-all duration-300 ease-out ${
                  headerRevealed ? "opacity-100" : "opacity-0"
                }`}
              >
                <div className="font-head text-sm font-semibold uppercase tracking-wide">
                  {headerRevealed ? (
                    <ScrambleText text={`Grupo ${g.nombre}`} play={headerRevealed} />
                  ) : (
                    <span aria-hidden>&nbsp;</span>
                  )}
                </div>
                <ul className="mt-3 space-y-1.5">
                  {g.teams.length === 0 && headerRevealed && (
                    <li className="text-sm text-muted2">Sin equipos asignados.</li>
                  )}
                  {g.teams.map((t) => {
                    const key = `t:${g.id}:${t.id}`;
                    const teamRevealed = revealed.has(key);
                    return (
                      <li
                        key={t.id}
                        className={`border border-line/60 px-3 py-1.5 text-sm text-bone transition-all duration-300 ease-out ${
                          teamRevealed
                            ? "translate-y-0 opacity-100"
                            : "translate-y-1.5 opacity-0"
                        }`}
                      >
                        {teamRevealed ? (
                          <>
                            <ScrambleText text={t.nombre} play={teamRevealed} />{" "}
                            <span className="font-mono text-xs text-muted">
                              [{t.tag}]
                            </span>
                          </>
                        ) : (
                          <span aria-hidden>&nbsp;</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
