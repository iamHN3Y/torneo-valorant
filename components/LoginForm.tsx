"use client";

import { useActionState, useState } from "react";
import { loginTeam, loginCo, type LoginState } from "@/app/ingresar/actions";

const inputCls =
  "w-full min-h-[46px] border border-line bg-void2 px-3 text-bone placeholder:text-muted2 transition focus:border-teal focus:outline-none focus:[box-shadow:0_0_0_1px_var(--color-teal),0_0_18px_rgba(25,232,200,.2)]";

export default function LoginForm({ defaultCo = false }: { defaultCo?: boolean }) {
  const [tab, setTab] = useState<"equipo" | "co">(defaultCo ? "co" : "equipo");
  const [teamState, teamAction, teamPending] = useActionState<LoginState, FormData>(
    loginTeam,
    {}
  );
  const [coState, coAction, coPending] = useActionState<LoginState, FormData>(
    loginCo,
    {}
  );

  return (
    <div className="surface clip-corner-tl p-6 sm:p-8">
      {/* Tabs */}
      <div className="mb-6 grid grid-cols-2 gap-2">
        {(["equipo", "co"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`ripple-host border px-4 py-2 font-head text-sm font-bold uppercase tracking-wider transition ${
              tab === t
                ? "border-teal bg-panel2 text-bone glow-teal"
                : "border-line bg-panel text-muted hover:text-bone-dim"
            }`}
          >
            {t === "equipo" ? "Equipo" : "Comité"}
          </button>
        ))}
      </div>

      {tab === "equipo" ? (
        <form action={teamAction} className="space-y-4">
          <label className="block">
            <span className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-muted">
              Identificador del equipo
            </span>
            <input
              name="identifier"
              placeholder="NOMBRE#TAG  ·  ej. Jaguares#JAG"
              autoComplete="username"
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-muted">
              Contraseña
            </span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              className={inputCls}
            />
          </label>
          {teamState.error && (
            <p className="border-l-2 border-brand bg-brand/5 px-3 py-2 text-sm text-brand">
              {teamState.error}
            </p>
          )}
          <button
            type="submit"
            disabled={teamPending}
            className="cyber-btn cyber-btn-primary w-full disabled:opacity-50"
          >
            {teamPending ? "Entrando…" : "Entrar a mi equipo"}
          </button>
          <p className="text-center font-mono text-[11px] text-muted2">
            ¿Aún no tienes equipo?{" "}
            <a href="/inscripcion" className="text-teal hover:text-glow-teal">
              Inscríbete
            </a>
          </p>
        </form>
      ) : (
        <form action={coAction} className="space-y-4">
          <label className="block">
            <span className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-muted">
              Usuario del Comité
            </span>
            <input
              name="username"
              placeholder="usuario"
              autoComplete="username"
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-muted">
              Contraseña
            </span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              className={inputCls}
            />
          </label>
          {coState.error && (
            <p className="border-l-2 border-brand bg-brand/5 px-3 py-2 text-sm text-brand">
              {coState.error}
            </p>
          )}
          <button
            type="submit"
            disabled={coPending}
            className="cyber-btn cyber-btn-primary w-full disabled:opacity-50"
          >
            {coPending ? "Entrando…" : "Acceder al panel del CO"}
          </button>
          <p className="text-center font-mono text-[11px] text-muted2">
            Área restringida · solo Comité Organizador
          </p>
        </form>
      )}
    </div>
  );
}
