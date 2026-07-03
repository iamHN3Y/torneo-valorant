"use client";

import { useState, useTransition } from "react";
import type { DbTournament, TournamentEstado } from "@/lib/repo";
import {
  createTournamentAction,
  setTournamentEstadoAction,
} from "@/app/admin/actions";

const ESTADOS: { value: TournamentEstado; label: string; color: string }[] = [
  { value: "borrador", label: "Borrador", color: "text-muted" },
  { value: "inscripciones", label: "Inscripciones", color: "text-teal" },
  { value: "en_curso", label: "En curso", color: "text-gold" },
  { value: "finalizado", label: "Finalizado", color: "text-muted2" },
];

export default function TournamentsPanel({
  tournaments,
}: {
  tournaments: DbTournament[];
}) {
  const [pending, startTransition] = useTransition();
  const [nombre, setNombre] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function crear() {
    setErr(null);
    startTransition(async () => {
      const res = await createTournamentAction(nombre);
      if (res.error) setErr(res.error);
      else setNombre("");
    });
  }

  return (
    <div className="surface clip-corner p-5">
      <div className="font-head text-sm font-semibold uppercase tracking-wide">
        Torneos
      </div>

      {/* Crear torneo */}
      <div className="mt-4 flex flex-wrap gap-2">
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre del nuevo torneo"
          className="min-h-[42px] flex-1 border border-line bg-void2 px-3 text-bone placeholder:text-muted2 focus:border-teal focus:outline-none"
        />
        <button
          onClick={crear}
          disabled={pending || nombre.trim().length < 3}
          className="cyber-btn cyber-btn-primary text-xs disabled:opacity-40"
        >
          + Crear
        </button>
      </div>
      {err && <p className="mt-2 text-sm text-brand">{err}</p>}

      {/* Lista */}
      <div className="mt-5 space-y-2">
        {tournaments.length === 0 && (
          <p className="text-sm text-muted">Sin torneos todavía.</p>
        )}
        {tournaments.map((t) => (
          <TournamentRow key={t.id} t={t} />
        ))}
      </div>
      <p className="mt-4 font-mono text-[10px] leading-relaxed text-muted2">
        Solo un torneo debería estar en “Inscripciones” o “En curso” a la vez: es
        el que reciben los equipos como activo.
      </p>
    </div>
  );
}

function TournamentRow({ t }: { t: DbTournament }) {
  const [pending, startTransition] = useTransition();
  const [estado, setEstado] = useState<TournamentEstado>(t.estado);
  const [err, setErr] = useState<string | null>(null);

  function change(value: TournamentEstado) {
    setEstado(value);
    setErr(null);
    startTransition(async () => {
      const res = await setTournamentEstadoAction(t.id, value);
      if (res.error) setErr(res.error);
    });
  }

  const active = estado === "inscripciones" || estado === "en_curso";

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 border px-3 py-2 ${
        active ? "border-teal/50 bg-teal/5" : "border-line bg-panel"
      }`}
    >
      <div className="min-w-0">
        <span className="font-head text-sm font-semibold text-bone">
          {t.nombre}
        </span>
        <span className="ml-2 font-mono text-[10px] uppercase text-muted">
          {t.temporada}
        </span>
        {err && <div className="text-xs text-brand">{err}</div>}
      </div>
      <select
        value={estado}
        disabled={pending}
        onChange={(e) => change(e.target.value as TournamentEstado)}
        className="min-h-[34px] border border-line bg-void2 px-2 text-xs font-head uppercase tracking-wide text-bone focus:border-teal focus:outline-none disabled:opacity-50"
      >
        {ESTADOS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}
