"use client";

import { useState, useTransition } from "react";
import { TEAM_ACCENTS, TEAM_ACCENT_HEX } from "@/lib/teamAccent";
import { setAccentAction } from "@/app/(site)/equipo/actions";
import Sigil from "@/components/ui/Sigil";

export default function AccentSelector({
  teamId,
  current,
  editable,
}: {
  teamId: string;
  current: string;
  editable: boolean;
}) {
  const [accent, setAccent] = useState(current);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok?: boolean; error?: string } | null>(null);

  function choose(value: string) {
    if (!editable || pending || value === accent) return;
    setMsg(null);
    startTransition(async () => {
      const res = await setAccentAction(value);
      if (res.ok) setAccent(value);
      setMsg(res);
    });
  }

  if (!editable) {
    return (
      <div className="flex items-center gap-3">
        <Sigil teamId={teamId} accent={TEAM_ACCENT_HEX[current as keyof typeof TEAM_ACCENT_HEX] ?? "#7E8C99"} size={40} />
        <p className="text-xs text-muted">
          Tu acento de color está congelado (roster bloqueado o inscripción
          aprobada). No puedes cambiarlo en esta fase.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {TEAM_ACCENTS.map((a) => {
          const hex = TEAM_ACCENT_HEX[a];
          const selected = a === accent;
          return (
            <button
              key={a}
              type="button"
              onClick={() => choose(a)}
              disabled={pending}
              aria-pressed={selected}
              className={`flex flex-col items-center gap-1.5 border p-2.5 transition disabled:cursor-not-allowed disabled:opacity-50 ${
                selected
                  ? "border-bone bg-panel2"
                  : "border-line bg-panel hover:border-bone-dim"
              }`}
              style={selected ? { boxShadow: `0 0 0 1px ${hex}, 0 0 16px ${hex}55` } : undefined}
            >
              <Sigil teamId={teamId} accent={hex} size={36} />
              <span className="font-mono text-[10px] uppercase tracking-widest text-bone-dim">
                {a}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-3 text-sm">
        {pending && <span className="text-muted">Guardando…</span>}
        {msg?.ok && <span className="text-teal">✓ Acento actualizado.</span>}
        {msg?.error && <span className="text-brand">{msg.error}</span>}
      </div>
    </div>
  );
}
