"use client";

import { useMemo, useState, useTransition } from "react";
import type { Player, Rama, RankId } from "@/lib/types";
import { RANKS, rankPoints, ROSTER_RULES } from "@/lib/ranks";
import { validateRoster, type Requisito } from "@/lib/validation";
import { registerTeamAction } from "./actions";

const NACIONALIDADES = [
  { code: "MX", label: "México 🇲🇽" },
  { code: "AR", label: "Argentina 🇦🇷" },
  { code: "CO", label: "Colombia 🇨🇴" },
  { code: "CL", label: "Chile 🇨🇱" },
  { code: "PE", label: "Perú 🇵🇪" },
  { code: "US", label: "EE. UU. 🇺🇸" },
  { code: "OT", label: "Otro" },
];

type VerifyState = "idle" | "loading" | "ok" | "notfound" | "error";

/** Ripple Material para botones (respeta reduced-motion). */
function ripple(e: React.PointerEvent<HTMLElement>) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const ink = document.createElement("span");
  ink.className = "ripple-ink";
  ink.style.width = ink.style.height = `${size}px`;
  ink.style.left = `${e.clientX - rect.left - size / 2}px`;
  ink.style.top = `${e.clientY - rect.top - size / 2}px`;
  el.appendChild(ink);
  window.setTimeout(() => ink.remove(), 650);
}

function nuevoJugador(rol: "titular" | "suplente"): Player {
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

const STEPS = [
  { label: "Equipo", hint: "Nombre, tag y rama" },
  { label: "Roster", hint: "Jugadores y validación" },
  { label: "Inscripción", hint: "Resumen y acceso" },
] as const;

export interface TorneoInfo {
  hayTorneo: boolean;
  gratuito: boolean;
  cuota: string;
  nombre: string;
}

export default function InscripcionForm({ torneo }: { torneo: TorneoInfo }) {
  const [step, setStep] = useState(0);

  // Paso 1 — datos del equipo
  const [nombre, setNombre] = useState("");
  const [tag, setTag] = useState("");
  const [rama, setRama] = useState<Rama>("amateur");

  // Paso 2 — roster
  const [jugadores, setJugadores] = useState<Player[]>(() => {
    const base = Array.from({ length: 5 }, () => nuevoJugador("titular"));
    base[0].esCapitan = true;
    return base;
  });
  const [verify, setVerify] = useState<Record<string, VerifyState>>({});

  // Paso 3 — acceso del equipo y envío
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();

  const titulares = jugadores.filter((j) => j.rol === "titular");
  const suplentes = jugadores.filter((j) => j.rol === "suplente");

  const validacion = useMemo(
    () => validateRoster(jugadores, rama),
    [jugadores, rama]
  );

  const paso1Ok = nombre.trim().length >= 3 && tag.trim().length >= 2;
  const passwordOk = password.length >= 6 && password === password2;

  function enviarInscripcion() {
    setSubmitError(null);
    const players = jugadores.map((j) => ({
      nombre: j.nombre,
      riotId: j.riotId,
      rankId: j.rankId,
      nacionalidad: j.nacionalidad,
      rol: j.rol,
      esCapitan: !!j.esCapitan,
      riotVerificado: !!j.riotVerificado,
    }));
    startSubmit(async () => {
      const res = await registerTeamAction({
        nombre,
        tag,
        rama,
        password,
        players,
      });
      if (res?.error) setSubmitError(res.error);
    });
  }

  function canGoTo(i: number) {
    if (i === 0) return true;
    if (i === 1) return paso1Ok;
    return paso1Ok && validacion.valido;
  }

  function update(id: string, patch: Partial<Player>) {
    setJugadores((prev) =>
      prev.map((j) => (j.id === id ? { ...j, ...patch } : j))
    );
  }

  function setCapitan(id: string) {
    setJugadores((prev) => prev.map((j) => ({ ...j, esCapitan: j.id === id })));
  }

  function addSuplente() {
    if (suplentes.length >= ROSTER_RULES.suplentesMax) return;
    setJugadores((prev) => [...prev, nuevoJugador("suplente")]);
  }

  function removeJugador(id: string) {
    setJugadores((prev) => prev.filter((j) => j.id !== id));
  }

  async function verificarRiot(j: Player) {
    const [gameName, tagLine] = j.riotId.split("#");
    if (!gameName || !tagLine) {
      setVerify((v) => ({ ...v, [j.id]: "error" }));
      return;
    }
    setVerify((v) => ({ ...v, [j.id]: "loading" }));
    try {
      const res = await fetch("/api/riot/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameName, tagLine }),
      });
      const data = await res.json();
      if (data.exists) {
        setVerify((v) => ({ ...v, [j.id]: "ok" }));
        update(j.id, { riotVerificado: true });
      } else if (res.ok) {
        setVerify((v) => ({ ...v, [j.id]: "notfound" }));
        update(j.id, { riotVerificado: false });
      } else {
        setVerify((v) => ({ ...v, [j.id]: "error" }));
      }
    } catch {
      setVerify((v) => ({ ...v, [j.id]: "error" }));
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="font-mono text-xs uppercase tracking-[0.3em] text-brand">
        // Inscripción de equipo
      </div>
      <h1 className="mt-2 font-display text-4xl uppercase sm:text-5xl">
        Registra tu equipo
      </h1>
      <p className="mt-3 max-w-2xl text-bone-dim">
        Tranquilo: te guiamos por cada paso y validamos todo en tiempo real. No
        hace falta tener todo listo de golpe.
      </p>

      {/* Stepper con progreso */}
      <Stepper step={step} canGoTo={canGoTo} onGo={setStep} />

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* CONTENIDO DEL PASO */}
        <div>
          {step === 0 && (
            <div className="space-y-6">
              <Field
                label="Nombre del equipo"
                hint="Como aparecerá en transmisión (mín. 3 caracteres)."
              >
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Jaguares Esports"
                  className="input"
                />
              </Field>
              <Field
                label="Etiqueta (tag)"
                hint="Abreviatura corta de 2 a 5 letras."
              >
                <input
                  value={tag}
                  onChange={(e) => setTag(e.target.value.toUpperCase())}
                  maxLength={5}
                  placeholder="Ej. JAG"
                  className="input uppercase"
                />
              </Field>
              <Field
                label="Rama competitiva"
                hint="¿No sabes cuál? Si tienes jugadores Inmortal/Radiante de sobra, ve a Élite."
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  {(["amateur", "elite"] as Rama[]).map((r) => {
                    const on = rama === r;
                    return (
                      <button
                        key={r}
                        onPointerDown={ripple}
                        onClick={() => setRama(r)}
                        className={`ripple-host surface clip-corner-tl px-4 py-4 text-left transition ${
                          on ? "glow-teal border-teal" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-head text-base font-semibold uppercase">
                            {r === "amateur" ? "Amateur" : "Élite"}
                          </span>
                          <span
                            className={`h-3 w-3 rounded-full border ${
                              on
                                ? "border-teal bg-teal shadow-[0_0_10px_var(--color-teal)]"
                                : "border-muted"
                            }`}
                          />
                        </div>
                        <div className="mt-1 text-xs text-muted">
                          {r === "amateur"
                            ? `Tope de ${ROSTER_RULES.topePuntosAmateur} pts · ideal para subir`
                            : "Sin tope de puntos · máximo nivel"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Field>
              <button
                disabled={!paso1Ok}
                onPointerDown={ripple}
                onClick={() => setStep(1)}
                className="ripple-host cyber-btn cyber-btn-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continuar al roster →
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-7">
              <RosterGroup
                titulo={`Titulares (${titulares.length}/5)`}
                jugadores={titulares}
                verify={verify}
                onUpdate={update}
                onCapitan={setCapitan}
                onVerify={verificarRiot}
              />
              <div>
                <RosterGroup
                  titulo={`Suplentes (${suplentes.length}/${ROSTER_RULES.suplentesMax})`}
                  jugadores={suplentes}
                  verify={verify}
                  onUpdate={update}
                  onCapitan={setCapitan}
                  onVerify={verificarRiot}
                  onRemove={removeJugador}
                />
                {suplentes.length < ROSTER_RULES.suplentesMax && (
                  <button
                    onPointerDown={ripple}
                    onClick={addSuplente}
                    className="ripple-host mt-3 border border-dashed border-line px-4 py-2 font-head text-sm uppercase tracking-wide text-muted transition hover:border-teal hover:text-bone"
                  >
                    + Añadir suplente (opcional)
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onPointerDown={ripple}
                  onClick={() => setStep(0)}
                  className="ripple-host cyber-btn cyber-btn-ghost"
                >
                  ← Atrás
                </button>
                <button
                  disabled={!validacion.valido}
                  onPointerDown={ripple}
                  onClick={() => setStep(2)}
                  className="ripple-host cyber-btn cyber-btn-primary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continuar →
                </button>
              </div>
              {!validacion.valido && (
                <p className="font-mono text-xs text-muted">
                  Completa los requisitos del panel para continuar. Vas
                  {" "}
                  {validacion.requisitos.filter((r) => r.ok).length}/
                  {validacion.requisitos.length}.
                </p>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="surface clip-corner p-6">
                <div className="font-head text-lg font-semibold uppercase">
                  Resumen
                </div>
                <dl className="mt-4 space-y-2 text-sm">
                  <Row k="Equipo" v={`${nombre} [${tag}]`} />
                  <Row k="Rama" v={rama === "amateur" ? "Amateur" : "Élite"} />
                  <Row k="Titulares" v={`${titulares.length}`} />
                  <Row k="Suplentes" v={`${suplentes.length}`} />
                  <Row k="Puntos de roster" v={`${validacion.puntosTitulares}`} />
                  <Row k="Cupo" v="Por orden de inscripción (Art. 12)" />
                </dl>
              </div>
              {/* Crear acceso del equipo */}
              <div className="surface clip-corner-tl p-5">
                <div className="font-head text-xs font-semibold uppercase tracking-widest text-teal">
                  Crea el acceso de tu equipo
                </div>
                <p className="mt-2 text-sm text-bone-dim">
                  Con esto entrarás a tu panel. Tu usuario será{" "}
                  <strong className="text-bone">
                    {nombre || "NOMBRE"}#{tag || "TAG"}
                  </strong>
                  .
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Field label="Contraseña" hint="Mínimo 6 caracteres.">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      className="input"
                    />
                  </Field>
                  <Field label="Repetir contraseña">
                    <input
                      type="password"
                      value={password2}
                      onChange={(e) => setPassword2(e.target.value)}
                      autoComplete="new-password"
                      className="input"
                    />
                  </Field>
                </div>
                {password2.length > 0 && password !== password2 && (
                  <p className="mt-2 text-xs text-brand">
                    Las contraseñas no coinciden.
                  </p>
                )}
              </div>

              {/* Cuota + envío */}
              <div
                className={`surface clip-corner-tl p-5 ${
                  torneo.gratuito ? "" : "surface-gold"
                }`}
              >
                <div
                  className={`font-head text-xs font-semibold uppercase tracking-widest ${
                    torneo.gratuito ? "text-teal" : "text-gold"
                  }`}
                >
                  {torneo.gratuito
                    ? "◆ Torneo gratuito"
                    : "Cuota de inscripción"}
                </div>
                {torneo.gratuito ? (
                  <p className="mt-2 text-sm text-bone-dim">
                    Esta edición <strong className="text-bone">no tiene costo</strong>.
                    Al confirmar, tu equipo queda{" "}
                    <strong className="text-bone">en revisión</strong> por el
                    Comité y entrarás directo a tu panel.
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-bone-dim">
                    Monto: <strong className="text-bone">{torneo.cuota}</strong>.
                    Al confirmar, tu equipo queda{" "}
                    <strong className="text-bone">pendiente de pago</strong>; el
                    Comité te indicará cómo cubrir la cuota para pasar a
                    revisión.
                  </p>
                )}
                {submitError && (
                  <p className="mt-3 border-l-2 border-brand bg-brand/5 px-3 py-2 text-sm text-brand">
                    {submitError}
                  </p>
                )}
                <button
                  onPointerDown={ripple}
                  onClick={enviarInscripcion}
                  disabled={!passwordOk || !validacion.valido || submitting}
                  className="ripple-host cyber-btn cyber-btn-primary mt-4 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {submitting ? "Enviando…" : "Confirmar inscripción"}
                </button>
                {!passwordOk && (
                  <p className="mt-2 font-mono text-xs text-muted">
                    Define una contraseña (mín. 6, que coincida) para confirmar.
                  </p>
                )}
              </div>
              <button
                onPointerDown={ripple}
                onClick={() => setStep(1)}
                className="ripple-host cyber-btn cyber-btn-ghost"
              >
                ← Atrás
              </button>
            </div>
          )}
        </div>

        {/* PANEL DE PROGRESO EN VIVO */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <ProgresoPanel
            puntos={validacion.puntosTitulares}
            tope={validacion.topePuntos}
            requisitos={validacion.requisitos}
            avisos={validacion.avisos}
            valido={validacion.valido}
          />
        </aside>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          min-height: 46px;
          border: 1px solid var(--color-line);
          background: var(--color-void2);
          color: var(--color-bone);
          padding: 0 13px;
          font-size: 15px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input::placeholder {
          color: var(--color-muted2);
        }
        .input:focus {
          outline: none;
          border-color: var(--color-teal);
          box-shadow: 0 0 0 1px var(--color-teal), 0 0 18px rgba(25, 232, 200, 0.2);
        }
        select.input {
          padding: 0 8px;
        }
      `}</style>
    </div>
  );
}

/* ----------------------------- STEPPER ----------------------------- */

function Stepper({
  step,
  canGoTo,
  onGo,
}: {
  step: number;
  canGoTo: (i: number) => boolean;
  onGo: (i: number) => void;
}) {
  return (
    <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-0">
      {STEPS.map((s, i) => {
        const done = i < step;
        const current = i === step;
        const reachable = canGoTo(i);
        return (
          <div key={s.label} className="flex flex-1 items-stretch">
            <button
              type="button"
              disabled={!reachable}
              onPointerDown={(e) => reachable && ripple(e)}
              onClick={() => reachable && onGo(i)}
              className={`ripple-host group relative flex flex-1 items-center gap-3 border px-4 py-3 text-left transition ${
                current
                  ? "border-teal bg-panel2 glow-teal"
                  : done
                    ? "border-line bg-panel"
                    : "border-line/60 bg-panel/50"
              } ${reachable ? "cursor-pointer hover:border-teal" : "cursor-not-allowed opacity-60"}`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center font-display text-lg transition ${
                  current
                    ? "bg-teal text-void shadow-[0_0_14px_var(--color-teal)]"
                    : done
                      ? "bg-teal/20 text-teal"
                      : "bg-void2 text-muted"
                }`}
                style={{ clipPath: "polygon(8px 0,100% 0,100% 100%,0 100%,0 8px)" }}
              >
                {done ? "✓" : i + 1}
              </span>
              <span className="min-w-0">
                <span
                  className={`block font-head text-sm font-semibold uppercase tracking-wide ${
                    current ? "text-bone" : "text-bone-dim"
                  }`}
                >
                  {s.label}
                </span>
                <span className="block truncate font-mono text-[10px] uppercase tracking-wider text-muted">
                  {s.hint}
                </span>
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <span
                aria-hidden
                className={`hidden w-6 self-center sm:block ${
                  done ? "text-teal" : "text-muted2"
                }`}
              >
                <span className="block h-px w-full bg-current" />
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ----------------------------- CAMPOS ----------------------------- */

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-muted">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-muted2">{hint}</span>}
    </label>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b border-line/50 pb-1">
      <dt className="text-muted">{k}</dt>
      <dd className="text-bone">{v}</dd>
    </div>
  );
}

/* ----------------------------- ROSTER ----------------------------- */

function RosterGroup({
  titulo,
  jugadores,
  verify,
  onUpdate,
  onCapitan,
  onVerify,
  onRemove,
}: {
  titulo: string;
  jugadores: Player[];
  verify: Record<string, VerifyState>;
  onUpdate: (id: string, patch: Partial<Player>) => void;
  onCapitan: (id: string) => void;
  onVerify: (j: Player) => void;
  onRemove?: (id: string) => void;
}) {
  return (
    <div>
      <div className="mb-3 font-head text-sm font-semibold uppercase tracking-wide text-bone-dim">
        {titulo}
      </div>
      <div className="space-y-3">
        {jugadores.map((j) => (
          <PlayerRow
            key={j.id}
            j={j}
            estado={verify[j.id] ?? "idle"}
            onUpdate={onUpdate}
            onCapitan={onCapitan}
            onVerify={onVerify}
            onRemove={onRemove}
          />
        ))}
        {jugadores.length === 0 && (
          <p className="text-sm text-muted2">Sin jugadores en este grupo.</p>
        )}
      </div>
    </div>
  );
}

function PlayerRow({
  j,
  estado,
  onUpdate,
  onCapitan,
  onVerify,
  onRemove,
}: {
  j: Player;
  estado: VerifyState;
  onUpdate: (id: string, patch: Partial<Player>) => void;
  onCapitan: (id: string) => void;
  onVerify: (j: Player) => void;
  onRemove?: (id: string) => void;
}) {
  const verifyBadge = {
    idle: null,
    loading: <span className="text-muted">Verificando…</span>,
    ok: <span className="text-teal">✓ Verificado</span>,
    notfound: <span className="text-brand">✗ No existe</span>,
    error: <span className="text-gold">⚠ Revisa el formato</span>,
  }[estado];

  return (
    <div className="surface p-3">
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_140px_120px]">
        <input
          value={j.nombre}
          onChange={(e) => onUpdate(j.id, { nombre: e.target.value })}
          placeholder="Nombre / nick"
          className="input"
        />
        <div className="flex gap-1">
          <input
            value={j.riotId}
            onChange={(e) =>
              onUpdate(j.id, { riotId: e.target.value, riotVerificado: false })
            }
            placeholder="Riot ID  Nombre#TAG"
            className="input"
          />
          <button
            onPointerDown={ripple}
            onClick={() => onVerify(j)}
            className="ripple-host shrink-0 border border-line bg-void2 px-2 font-head text-[11px] uppercase text-teal transition hover:border-teal hover:[box-shadow:0_0_14px_rgba(25,232,200,.25)]"
          >
            Verif.
          </button>
        </div>
        <select
          value={j.rankId}
          onChange={(e) => onUpdate(j.id, { rankId: e.target.value as RankId })}
          className="input"
        >
          {RANKS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label} ({r.points})
            </option>
          ))}
        </select>
        <select
          value={j.nacionalidad}
          onChange={(e) => onUpdate(j.id, { nacionalidad: e.target.value })}
          className="input"
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
            name="capitan"
            checked={!!j.esCapitan}
            onChange={() => onCapitan(j.id)}
            className="accent-teal"
          />
          Capitán
        </label>
        <div className="flex items-center gap-3">
          <span>{verifyBadge}</span>
          <span className="font-mono text-muted">{rankPoints(j.rankId)} pts</span>
          {onRemove && (
            <button
              onClick={() => onRemove(j.id)}
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

/* --------------------------- PANEL PROGRESO --------------------------- */

function ProgresoPanel({
  puntos,
  tope,
  requisitos,
  avisos,
  valido,
}: {
  puntos: number;
  tope: number | null;
  requisitos: Requisito[];
  avisos: string[];
  valido: boolean;
}) {
  const pct = tope ? Math.min((puntos / tope) * 100, 100) : 0;
  const overTope = tope !== null && puntos > tope;
  const okCount = requisitos.filter((r) => r.ok).length;

  return (
    <div className="surface clip-corner p-5">
      <div className="flex items-center justify-between">
        <span className="font-head text-sm font-semibold uppercase tracking-wide">
          Tu progreso
        </span>
        <span className="font-mono text-xs text-muted">
          {okCount}/{requisitos.length}
        </span>
      </div>

      {/* Medidor de puntos */}
      <div className="mt-4">
        <div className="flex items-end justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
            Puntos titulares
          </span>
          <span
            className={`font-display text-3xl ${
              overTope ? "text-brand text-glow-brand" : "text-bone text-glow-teal"
            }`}
          >
            {puntos}
            <span className="text-muted">/{tope ?? "∞"}</span>
          </span>
        </div>
        {tope !== null && (
          <div className="meter mt-2 h-2 w-full overflow-hidden rounded bg-void2">
            <span
              className={overTope ? "bg-brand" : "bg-teal"}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>

      {/* Estado global */}
      <div
        className={`mt-4 border-l-2 px-3 py-2 text-sm ${
          valido
            ? "border-teal bg-teal/5 text-teal"
            : "border-gold bg-gold/5 text-gold"
        }`}
      >
        {valido
          ? "✓ ¡Todo listo! Puedes continuar."
          : "Casi… completa lo que falta abajo."}
      </div>

      {/* Checklist de requisitos */}
      <ul className="mt-4 space-y-2">
        {requisitos.map((r) => (
          <li key={r.id} className="flex items-start gap-3">
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition ${
                r.ok
                  ? "bg-teal/20 text-teal shadow-[0_0_8px_rgba(25,232,200,.4)]"
                  : "bg-void2 text-muted2"
              }`}
            >
              {r.ok ? "✓" : "•"}
            </span>
            <span className="min-w-0">
              <span
                className={`block text-sm ${r.ok ? "text-bone" : "text-bone-dim"}`}
              >
                {r.label}
              </span>
              <span className="block font-mono text-[10px] uppercase tracking-wider text-muted2">
                {r.hint}
              </span>
            </span>
          </li>
        ))}
      </ul>

      {avisos.length > 0 && (
        <ul className="mt-4 space-y-1 border-t border-line/60 pt-3 text-xs text-gold">
          {avisos.map((a, i) => (
            <li key={i}>⚠ {a}</li>
          ))}
        </ul>
      )}

      <p className="mt-4 font-mono text-[10px] leading-relaxed text-muted2">
        Reglas: Art. 11 (base nacional) · Art. 12 (5+2) · Art. 16 (puntos y
        rangos).
      </p>
    </div>
  );
}
