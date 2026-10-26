"use client";

import { useMemo, useState, useTransition } from "react";
import type { Player, RankId, Rol } from "@/lib/types";
import type { DbPlayer } from "@/lib/repo";
import { RANKS, rankPoints, ROSTER_RULES } from "@/lib/ranks";
import { validateRoster } from "@/lib/validation";
import { saveRosterAction } from "@/app/(site)/equipo/actions";

const NACIONALIDADES = [
  { code: "MX", label: "México 🇲🇽" },
  { code: "AR", label: "Argentina 🇦🇷" },
  { code: "CO", label: "Colombia 🇨🇴" },
  { code: "CL", label: "Chile 🇨🇱" },
  { code: "PE", label: "Perú 🇵🇪" },
  { code: "US", label: "EE. UU. 🇺🇸" },
  { code: "OT", label: "Otro" },
];

const inputCls =
  "w-full min-h-[42px] border border-line bg-void2 px-3 text-bone placeholder:text-muted2 transition focus:border-teal focus:outline-none";

type EditablePlayer = Player;

function nuevo(rol: Rol): EditablePlayer {
  return {
    id: crypto.randomUUID(),
    nombre: "",
    riotId: "",
    rankId: "hierro_oro",
    nacionalidad: "MX",
    rol,
    esCapitan: false,
    riotVerificado: false,
  };
}

function seed(players: DbPlayer[]): EditablePlayer[] {
  if (players.length > 0) {
    return players.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      riotId: p.riotId,
      rankId: p.rankId,
      nacionalidad: p.nacionalidad,
      rol: p.rol,
      esCapitan: p.esCapitan,
      riotVerificado: p.riotVerificado,
    }));
  }
  const base = Array.from({ length: 5 }, () => nuevo("titular"));
  base[0].esCapitan = true;
  return base;
}

export default function RosterEditor({
  initialPlayers,
  rama,
  locked,
}: {
  initialPlayers: DbPlayer[];
  rama: "amateur" | "elite";
  locked: boolean;
}) {
  const [players, setPlayers] = useState<EditablePlayer[]>(() =>
    seed(initialPlayers)
  );
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok?: boolean; error?: string } | null>(null);

  const titulares = players.filter((p) => p.rol === "titular");
  const suplentes = players.filter((p) => p.rol === "suplente");
  const validacion = useMemo(() => validateRoster(players, rama), [players, rama]);

  function update(id: string, patch: Partial<EditablePlayer>) {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    setMsg(null);
  }
  function setCapitan(id: string) {
    setPlayers((prev) => prev.map((p) => ({ ...p, esCapitan: p.id === id })));
  }
  function addSuplente() {
    if (suplentes.length >= ROSTER_RULES.suplentesMax) return;
    setPlayers((prev) => [...prev, nuevo("suplente")]);
  }
  function remove(id: string) {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  }

  function save() {
    setMsg(null);
    const payload = players.map((p) => ({
      nombre: p.nombre,
      riotId: p.riotId,
      rankId: p.rankId,
      nacionalidad: p.nacionalidad,
      rol: p.rol,
      esCapitan: !!p.esCapitan,
      riotVerificado: !!p.riotVerificado,
    }));
    startTransition(async () => {
      const res = await saveRosterAction(payload);
      setMsg(res);
    });
  }

  if (locked) {
    return (
      <div>
        <div className="mb-4 border-l-2 border-gold bg-gold/5 px-3 py-2 text-sm text-gold">
          🔒 El Comité Organizador bloqueó tu roster. Ya no puedes editarlo en
          esta fase (Art. 13).
        </div>
        <RosterReadonly players={players} />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-6">
        <Group title={`Titulares (${titulares.length}/5)`}>
          {titulares.map((p) => (
            <Row
              key={p.id}
              p={p}
              onUpdate={update}
              onCapitan={setCapitan}
            />
          ))}
        </Group>

        <div>
          <Group title={`Suplentes (${suplentes.length}/${ROSTER_RULES.suplentesMax})`}>
            {suplentes.map((p) => (
              <Row
                key={p.id}
                p={p}
                onUpdate={update}
                onCapitan={setCapitan}
                onRemove={remove}
              />
            ))}
            {suplentes.length === 0 && (
              <p className="text-sm text-muted2">Sin suplentes.</p>
            )}
          </Group>
          {suplentes.length < ROSTER_RULES.suplentesMax && (
            <button
              onClick={addSuplente}
              className="mt-3 border border-dashed border-line px-4 py-2 font-head text-sm uppercase tracking-wide text-muted transition hover:border-teal hover:text-bone"
            >
              + Añadir suplente
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={save}
            disabled={pending || !validacion.valido}
            className="cyber-btn cyber-btn-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? "Guardando…" : "Guardar roster"}
          </button>
          {msg?.ok && (
            <span className="text-sm text-teal">✓ Roster guardado.</span>
          )}
          {msg?.error && <span className="text-sm text-brand">{msg.error}</span>}
          {!validacion.valido && !msg && (
            <span className="font-mono text-xs text-muted">
              Cumple los requisitos para guardar.
            </span>
          )}
        </div>
      </div>

      {/* Panel de requisitos */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="surface clip-corner p-5">
          <div className="flex items-center justify-between">
            <span className="font-head text-sm font-semibold uppercase tracking-wide">
              Requisitos
            </span>
            <span className="font-mono text-xs text-muted">
              {validacion.requisitos.filter((r) => r.ok).length}/
              {validacion.requisitos.length}
            </span>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
              Puntos titulares
            </span>
            <span className="font-display text-2xl text-glow-teal">
              {validacion.puntosTitulares}
              <span className="text-muted">/{validacion.topePuntos ?? "∞"}</span>
            </span>
          </div>
          <ul className="mt-4 space-y-2">
            {validacion.requisitos.map((r) => (
              <li key={r.id} className="flex items-start gap-2.5">
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    r.ok
                      ? "bg-teal/20 text-teal shadow-[0_0_8px_rgba(25,232,200,.4)]"
                      : "bg-void2 text-muted2"
                  }`}
                >
                  {r.ok ? "✓" : "•"}
                </span>
                <span className="min-w-0">
                  <span className={`block text-sm ${r.ok ? "text-bone" : "text-bone-dim"}`}>
                    {r.label}
                  </span>
                  <span className="block font-mono text-[10px] uppercase tracking-wider text-muted2">
                    {r.hint}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3 font-head text-sm font-semibold uppercase tracking-wide text-bone-dim">
        {title}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Row({
  p,
  onUpdate,
  onCapitan,
  onRemove,
}: {
  p: EditablePlayer;
  onUpdate: (id: string, patch: Partial<EditablePlayer>) => void;
  onCapitan: (id: string) => void;
  onRemove?: (id: string) => void;
}) {
  return (
    <div className="surface p-3">
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_130px_120px]">
        <input
          value={p.nombre}
          onChange={(e) => onUpdate(p.id, { nombre: e.target.value })}
          placeholder="Nombre / nick"
          className={inputCls}
        />
        <input
          value={p.riotId}
          onChange={(e) => onUpdate(p.id, { riotId: e.target.value })}
          placeholder="Riot ID  Nombre#TAG"
          className={inputCls}
        />
        <select
          value={p.rankId}
          onChange={(e) => onUpdate(p.id, { rankId: e.target.value as RankId })}
          className={inputCls}
        >
          {RANKS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label} ({r.points})
            </option>
          ))}
        </select>
        <select
          value={p.nacionalidad}
          onChange={(e) => onUpdate(p.id, { nacionalidad: e.target.value })}
          className={inputCls}
        >
          {NACIONALIDADES.map((n) => (
            <option key={n.code} value={n.code}>
              {n.label}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <label className="flex cursor-pointer items-center gap-2 text-bone-dim">
          <input
            type="radio"
            name="capitan-editor"
            checked={!!p.esCapitan}
            onChange={() => onCapitan(p.id)}
            className="accent-teal"
          />
          Capitán
        </label>
        <div className="flex items-center gap-3">
          <span className="font-mono text-muted">{rankPoints(p.rankId)} pts</span>
          {onRemove && (
            <button
              onClick={() => onRemove(p.id)}
              className="text-muted2 transition hover:text-brand"
            >
              Quitar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function RosterReadonly({ players }: { players: EditablePlayer[] }) {
  return (
    <div className="space-y-2">
      {players.map((p) => (
        <div
          key={p.id}
          className="surface flex items-center justify-between p-3 text-sm"
        >
          <div>
            <span className="font-head font-semibold text-bone">
              {p.nombre || "—"}
            </span>
            {p.esCapitan && (
              <span className="ml-2 hud-chip text-teal">Capitán</span>
            )}
            <span className="ml-2 font-mono text-xs text-muted">{p.riotId}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="uppercase">{p.rol}</span>
            <span className="font-mono">{rankPoints(p.rankId)} pts</span>
          </div>
        </div>
      ))}
    </div>
  );
}
