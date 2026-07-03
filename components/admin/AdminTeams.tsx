"use client";

import { useState, useTransition } from "react";
import type { DbTeam } from "@/lib/repo";
import { ESTADO_LABEL } from "@/lib/data";
import {
  setTeamEstadoAction,
  toggleRosterLockAction,
  setTeamNotaAction,
} from "@/app/admin/actions";

const ESTADOS = Object.keys(ESTADO_LABEL);

export default function AdminTeams({ teams }: { teams: DbTeam[] }) {
  if (teams.length === 0) {
    return (
      <div className="surface p-6 text-center text-muted">
        Aún no hay equipos inscritos.
      </div>
    );
  }
  return (
    <div className="surface surface-gold overflow-x-auto">
      <table className="w-full min-w-[860px] text-sm">
        <thead>
          <tr className="bg-void2 text-left font-head uppercase">
            <th className="border-b-2 border-gold p-3 text-xs">#</th>
            <th className="border-b-2 border-gold p-3 text-xs">Equipo</th>
            <th className="border-b-2 border-gold p-3 text-xs">Rama</th>
            <th className="border-b-2 border-gold p-3 text-xs">Estado</th>
            <th className="border-b-2 border-gold p-3 text-xs">Roster</th>
            <th className="border-b-2 border-gold p-3 text-xs">Nota (visible al equipo)</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((t) => (
            <AdminTeamRow key={t.id} team={t} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdminTeamRow({ team }: { team: DbTeam }) {
  const [pending, startTransition] = useTransition();
  const [estado, setEstado] = useState(team.estado);
  const [locked, setLocked] = useState(team.rosterLocked);
  const [nota, setNota] = useState(team.notaCo ?? "");
  const [err, setErr] = useState<string | null>(null);

  function run(fn: () => Promise<{ ok?: boolean; error?: string }>) {
    setErr(null);
    startTransition(async () => {
      const res = await fn();
      if (res.error) setErr(res.error);
    });
  }

  function changeEstado(value: string) {
    setEstado(value as typeof estado);
    run(() => setTeamEstadoAction(team.id, value));
  }
  function toggleLock() {
    const next = !locked;
    setLocked(next);
    run(() => toggleRosterLockAction(team.id, next));
  }
  function saveNota() {
    if (nota === (team.notaCo ?? "")) return;
    run(() => setTeamNotaAction(team.id, nota));
  }

  const sel = ESTADO_LABEL[estado];

  return (
    <tr className="border-b border-line/40 odd:bg-white/[0.015]">
      <td className="p-3 font-mono text-muted">{team.ordenInscripcion ?? "—"}</td>
      <td className="p-3">
        <span className="font-head font-semibold text-bone">{team.nombre}</span>
        <span className="ml-2 font-mono text-xs text-muted">[{team.tag}]</span>
        {err && <div className="mt-1 text-xs text-brand">{err}</div>}
      </td>
      <td className="p-3">
        <span
          className={`font-head text-xs uppercase ${
            team.rama === "elite" ? "text-gold" : "text-bone-dim"
          }`}
        >
          {team.rama}
        </span>
      </td>
      <td className="p-3">
        <select
          value={estado}
          disabled={pending}
          onChange={(e) => changeEstado(e.target.value)}
          className={`min-h-[36px] border border-line bg-void2 px-2 text-xs font-head uppercase tracking-wide ${sel?.color ?? "text-bone"} focus:border-teal focus:outline-none disabled:opacity-50`}
        >
          {ESTADOS.map((s) => (
            <option key={s} value={s} className="text-bone">
              {ESTADO_LABEL[s].label}
            </option>
          ))}
        </select>
      </td>
      <td className="p-3">
        <button
          onClick={toggleLock}
          disabled={pending}
          className={`border px-3 py-1.5 font-head text-xs uppercase tracking-wide transition disabled:opacity-50 ${
            locked
              ? "border-gold bg-gold/10 text-gold"
              : "border-line text-muted hover:border-teal hover:text-bone"
          }`}
        >
          {locked ? "🔒 Bloqueado" : "🔓 Abierto"}
        </button>
      </td>
      <td className="p-3">
        <input
          value={nota}
          disabled={pending}
          onChange={(e) => setNota(e.target.value)}
          onBlur={saveNota}
          placeholder="Motivo, aviso…"
          className="min-h-[36px] w-full min-w-[160px] border border-line bg-void2 px-2 text-xs text-bone placeholder:text-muted2 focus:border-teal focus:outline-none disabled:opacity-50"
        />
      </td>
    </tr>
  );
}
