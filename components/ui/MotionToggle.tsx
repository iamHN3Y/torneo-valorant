"use client";

import { useTransition } from "react";
import type { MotionPref } from "@/lib/motion";
import { setMotionPreferenceAction } from "@/app/actions/motion";

const OPTIONS: { value: MotionPref; label: string; title: string }[] = [
  { value: "full", label: "Cine", title: "Cine — todas las animaciones" },
  { value: "auto", label: "Estándar", title: "Estándar — sigue la preferencia del sistema" },
  { value: "reduced", label: "Mínimo", title: "Mínimo — animaciones reducidas" },
];

/** Conmutador de intensidad de animación (Cine / Estándar / Mínimo). */
export default function MotionToggle({
  current,
  className = "",
}: {
  current: MotionPref;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();

  function choose(pref: MotionPref) {
    if (pref === current || pending) return;
    startTransition(() => {
      setMotionPreferenceAction(pref);
    });
  }

  return (
    <div
      role="group"
      aria-label="Intensidad de animación"
      className={`flex items-center gap-1 ${className}`}
    >
      {OPTIONS.map((opt) => {
        const active = current === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            title={opt.title}
            aria-pressed={active}
            disabled={pending}
            onClick={() => choose(opt.value)}
            className={`hud-chip transition disabled:opacity-50 ${
              active
                ? "border-teal text-teal"
                : "text-muted hover:border-teal hover:text-bone"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
