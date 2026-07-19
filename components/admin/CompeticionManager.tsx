"use client";

import { useState, useTransition } from "react";
import type { DbMatch, GroupWithTeams, DbRankingAdjustment } from "@/lib/repo";
import {
  createGroupAction,
  addGroupTeamAction,
  removeGroupTeamAction,
  createMatchAction,
  setMatchResultAction,
  deleteMatchAction,
  createAdjustmentAction,
  deleteAdjustmentAction,
} from "@/app/admin/competicion/actions";

interface Team {
  id: string;
  nombre: string;
  tag: string;
}

const inputCls =
  "min-h-[40px] border border-line bg-void2 px-2 text-sm text-bone placeholder:text-muted2 focus:border-teal focus:outline-none";

export default function CompeticionManager({
  teams,
  groups,
  matches,
  adjustments,
}: {
  teams: Team[];
  groups: GroupWithTeams[];
  matches: DbMatch[];
  adjustments: DbRankingAdjustment[];
}) {
  return (
    <div className="space-y-12">
      <GroupsSection teams={teams} groups={groups} />
      <MatchesSection teams={teams} groups={groups} matches={matches} />
      <AdjustmentsSection teams={teams} adjustments={adjustments} />
    </div>
  );
}

/* ------------------------- AJUSTES DE RANKING ------------------------- */

function AdjustmentsSection({
  teams,
  adjustments,
}: {
  teams: Team[];
  adjustments: DbRankingAdjustment[];
}) {
  const [pending, start] = useTransition();
  const [teamId, setTeamId] = useState("");
  const [puntos, setPuntos] = useState(0);
  const [motivo, setMotivo] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function crear() {
    setErr(null);
    start(async () => {
      const r = await createAdjustmentAction(teamId, puntos, motivo);
      if (r.error) setErr(r.error);
      else {
        setTeamId("");
        setPuntos(0);
        setMotivo("");
      }
    });
  }

  return (
    <section>
      <h2 className="font-head text-xl font-semibold uppercase tracking-wide">
        Ajustes de ranking
      </h2>
      <p className="mt-1 text-sm text-muted">
        Bonos y penalizaciones del Art. 43 (rival superior +15, consistencia
        +25, W.O. −40, disciplina −75 a −250). Se suman al cálculo automático.
      </p>

      <div className="surface mt-4 grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <select
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          className={`${inputCls} lg:col-span-2`}
        >
          <option value="">Equipo…</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre} [{t.tag}]
            </option>
          ))}
        </select>
        <input
          type="number"
          min={-500}
          max={500}
          value={puntos}
          onChange={(e) => setPuntos(Number(e.target.value))}
          placeholder="Puntos (±)"
          className={inputCls}
        />
        <input
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Motivo (ej. W.O. jornada 2)"
          className={`${inputCls} lg:col-span-2`}
        />
        <button
          onClick={crear}
          disabled={pending || !teamId || puntos === 0 || motivo.trim().length < 3}
          className="cyber-btn cyber-btn-primary text-xs disabled:opacity-40 sm:col-span-2 lg:col-span-5"
        >
          + Registrar ajuste
        </button>
      </div>
      {err && <p className="mt-2 text-sm text-brand">{err}</p>}

      <div className="mt-4 space-y-2">
        {adjustments.length === 0 && (
          <p className="text-sm text-muted2">Sin ajustes registrados.</p>
        )}
        {adjustments.map((a) => (
          <div
            key={a.id}
            className="surface flex flex-wrap items-center gap-3 p-3 text-sm"
          >
            <span className="font-head font-semibold text-bone">
              {a.teamNombre}
              <span className="ml-1 font-mono text-xs text-muted">
                [{a.teamTag}]
              </span>
            </span>
            <span
              className={`font-display text-lg ${
                a.puntos < 0 ? "text-brand" : "text-teal"
              }`}
            >
              {a.puntos > 0 ? `+${a.puntos}` : a.puntos}
            </span>
            <span className="min-w-0 flex-1 truncate text-bone-dim">
              {a.motivo}
            </span>
            <span className="font-mono text-[10px] text-muted2">
              {new Date(a.createdAt).toLocaleDateString("es-MX")}
            </span>
            <button
              onClick={() =>
                start(async () => void (await deleteAdjustmentAction(a.id)))
              }
              disabled={pending}
              className="text-muted2 transition hover:text-brand"
              title="Eliminar ajuste"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------ GRUPOS ------------------------------ */

function GroupsSection({
  teams,
  groups,
}: {
  teams: Team[];
  groups: GroupWithTeams[];
}) {
  const [pending, start] = useTransition();
  const [nombre, setNombre] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function crear() {
    setErr(null);
    start(async () => {
      const r = await createGroupAction(nombre);
      if (r.error) setErr(r.error);
      else setNombre("");
    });
  }

  return (
    <section>
      <h2 className="font-head text-xl font-semibold uppercase tracking-wide">
        Grupos
      </h2>
      <div className="mt-4 flex flex-wrap gap-2">
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre del grupo (ej. A)"
          className={`${inputCls} flex-1`}
        />
        <button
          onClick={crear}
          disabled={pending || !nombre.trim()}
          className="cyber-btn cyber-btn-primary text-xs disabled:opacity-40"
        >
          + Crear grupo
        </button>
      </div>
      {err && <p className="mt-2 text-sm text-brand">{err}</p>}

      {groups.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Aún no hay grupos.</p>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {groups.map((g) => (
            <GroupCard key={g.id} group={g} teams={teams} />
          ))}
        </div>
      )}
    </section>
  );
}

function GroupCard({ group, teams }: { group: GroupWithTeams; teams: Team[] }) {
  const [pending, start] = useTransition();
  const [sel, setSel] = useState("");
  const disponibles = teams.filter(
    (t) => !group.teams.some((gt) => gt.id === t.id)
  );

  return (
    <div className="surface p-4">
      <div className="font-head text-sm font-semibold uppercase tracking-wide">
        Grupo {group.nombre}
      </div>
      <ul className="mt-3 space-y-1.5">
        {group.teams.length === 0 && (
          <li className="text-sm text-muted2">Sin equipos.</li>
        )}
        {group.teams.map((t) => (
          <li
            key={t.id}
            className="flex items-center justify-between border border-line/60 px-3 py-1.5 text-sm"
          >
            <span className="text-bone">
              {t.nombre}{" "}
              <span className="font-mono text-xs text-muted">[{t.tag}]</span>
            </span>
            <button
              disabled={pending}
              onClick={() =>
                start(async () => {
                  await removeGroupTeamAction(group.id, t.id);
                })
              }
              className="text-muted2 transition hover:text-brand"
            >
              Quitar
            </button>
          </li>
        ))}
      </ul>
      {disponibles.length > 0 && (
        <div className="mt-3 flex gap-2">
          <select
            value={sel}
            onChange={(e) => setSel(e.target.value)}
            className={`${inputCls} flex-1`}
          >
            <option value="">Agregar equipo…</option>
            {disponibles.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre} [{t.tag}]
              </option>
            ))}
          </select>
          <button
            disabled={pending || !sel}
            onClick={() =>
              start(async () => {
                await addGroupTeamAction(group.id, sel);
                setSel("");
              })
            }
            className="border border-line px-3 font-head text-xs uppercase text-teal transition hover:border-teal disabled:opacity-40"
          >
            Añadir
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ PARTIDOS ------------------------------ */

function MatchesSection({
  teams,
  groups,
  matches,
}: {
  teams: Team[];
  groups: GroupWithTeams[];
  matches: DbMatch[];
}) {
  const [pending, start] = useTransition();
  const [ronda, setRonda] = useState("");
  const [formato, setFormato] = useState("Bo3");
  const [groupId, setGroupId] = useState("");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function crear() {
    setErr(null);
    start(async () => {
      const r = await createMatchAction({
        groupId: groupId || null,
        ronda,
        formato,
        teamAId: a || null,
        teamBId: b || null,
      });
      if (r.error) setErr(r.error);
      else {
        setRonda("");
        setA("");
        setB("");
      }
    });
  }

  return (
    <section>
      <h2 className="font-head text-xl font-semibold uppercase tracking-wide">
        Partidos
      </h2>

      {/* Crear partido */}
      <div className="surface mt-4 grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <input
          value={ronda}
          onChange={(e) => setRonda(e.target.value)}
          placeholder="Ronda (ej. Cuartos)"
          className={`${inputCls} lg:col-span-2`}
        />
        <select value={formato} onChange={(e) => setFormato(e.target.value)} className={inputCls}>
          <option>Bo1</option>
          <option>Bo3</option>
          <option>Bo5</option>
        </select>
        <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className={inputCls}>
          <option value="">Playoffs (sin grupo)</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              Grupo {g.nombre}
            </option>
          ))}
        </select>
        <select value={a} onChange={(e) => setA(e.target.value)} className={inputCls}>
          <option value="">Equipo A (por definir)</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre} [{t.tag}]
            </option>
          ))}
        </select>
        <select value={b} onChange={(e) => setB(e.target.value)} className={inputCls}>
          <option value="">Equipo B (por definir)</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre} [{t.tag}]
            </option>
          ))}
        </select>
        <button
          onClick={crear}
          disabled={pending || !ronda.trim()}
          className="cyber-btn cyber-btn-primary text-xs disabled:opacity-40 sm:col-span-2 lg:col-span-6"
        >
          + Crear partido
        </button>
      </div>
      {err && <p className="mt-2 text-sm text-brand">{err}</p>}

      {/* Lista de partidos */}
      <div className="mt-5 space-y-2">
        {matches.length === 0 && (
          <p className="text-sm text-muted">Aún no hay partidos.</p>
        )}
        {matches.map((m) => (
          <MatchRow key={m.id} m={m} />
        ))}
      </div>
    </section>
  );
}

function MatchRow({ m }: { m: DbMatch }) {
  const [pending, start] = useTransition();
  const [scoreA, setScoreA] = useState(m.scoreA);
  const [scoreB, setScoreB] = useState(m.scoreB);
  const [estado, setEstado] = useState(m.estado);
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(false);
    start(async () => {
      const r = await setMatchResultAction(m.id, scoreA, scoreB, estado);
      if (r.ok) setSaved(true);
    });
  }

  return (
    <div className="surface flex flex-wrap items-center gap-3 p-3">
      <span className="hud-chip">{m.ronda}</span>
      <span className="font-mono text-[10px] text-muted">{m.formato}</span>
      <div className="flex min-w-0 flex-1 items-center gap-2 text-sm">
        <span className="truncate text-bone-dim">
          {m.teamANombre ?? "Por definir"}
        </span>
        <input
          type="number"
          min={0}
          max={5}
          value={scoreA}
          onChange={(e) => setScoreA(Number(e.target.value))}
          className="w-12 border border-line bg-void2 px-2 py-1 text-center text-sm text-bone focus:border-teal focus:outline-none"
        />
        <span className="text-muted2">–</span>
        <input
          type="number"
          min={0}
          max={5}
          value={scoreB}
          onChange={(e) => setScoreB(Number(e.target.value))}
          className="w-12 border border-line bg-void2 px-2 py-1 text-center text-sm text-bone focus:border-teal focus:outline-none"
        />
        <span className="truncate text-bone-dim">
          {m.teamBNombre ?? "Por definir"}
        </span>
      </div>
      <select
        value={estado}
        onChange={(e) => setEstado(e.target.value as typeof estado)}
        className="min-h-[36px] border border-line bg-void2 px-2 text-xs font-head uppercase tracking-wide text-bone focus:border-teal focus:outline-none"
      >
        <option value="programado">Programado</option>
        <option value="en_vivo">En vivo</option>
        <option value="finalizado">Finalizado</option>
      </select>
      <button
        onClick={save}
        disabled={pending}
        className="border border-teal px-3 py-1.5 font-head text-xs uppercase text-teal transition hover:bg-teal/10 disabled:opacity-40"
      >
        {pending ? "…" : saved ? "✓" : "Guardar"}
      </button>
      <button
        onClick={() => start(async () => void (await deleteMatchAction(m.id)))}
        disabled={pending}
        className="text-muted2 transition hover:text-brand"
        title="Eliminar partido"
      >
        ✕
      </button>
    </div>
  );
}
