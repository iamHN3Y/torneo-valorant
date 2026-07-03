"use client";

import { useState } from "react";

const BASE_OPTIONS = [
  { value: 0, label: "Sin bono de posición" },
  { value: 45, label: "Clasifica a grupos (+45)" },
  { value: 90, label: "Top 8 (+90)" },
  { value: 160, label: "Top 4 (+160)" },
  { value: 260, label: "Subcampeón (+260)" },
  { value: 400, label: "Campeón (+400)" },
];

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
        {label}
      </span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) =>
          onChange(
            Math.max(min, Math.min(max, Number(e.target.value) || 0))
          )
        }
        className="min-h-[42px] border border-line bg-void2 px-3 text-bone transition focus:border-teal focus:outline-none focus:[box-shadow:0_0_0_1px_var(--color-teal)]"
      />
    </label>
  );
}

/** Calculadora rápida del Ranking Nacional — Art. 43. */
export default function RankingCalculator() {
  const [base, setBase] = useState(160);
  const [maps, setMaps] = useState(5);
  const [series, setSeries] = useState(2);
  const [rivals, setRivals] = useState(1);
  const [consistency, setConsistency] = useState(25);
  const [wo, setWo] = useState(0);
  const [penalty, setPenalty] = useState(0);

  const mapsPts = maps * 8;
  const seriesPts = series * 20;
  const rivalsPts = Math.min(rivals * 15, 60);
  const woPts = wo * 40;
  const total =
    base + mapsPts + seriesPts + rivalsPts + consistency - woPts - penalty;

  const breakdown = [
    { k: "Posición", v: base, neg: false },
    { k: `Mapas (${maps}×8)`, v: mapsPts, neg: false },
    { k: `Series (${series}×20)`, v: seriesPts, neg: false },
    { k: `Rivales sup. (máx 60)`, v: rivalsPts, neg: false },
    { k: "Consistencia", v: consistency, neg: false },
    { k: `W.O. (${wo}×40)`, v: woPts, neg: true },
    { k: "Penalización", v: penalty, neg: true },
  ];

  return (
    <div className="surface clip-corner-tl glow-teal p-5">
      <div className="font-head text-sm font-semibold uppercase tracking-wide text-teal">
        Calculadora de ranking
      </div>
      <p className="mt-1 text-xs text-muted">
        Estima los puntos que sumaría un equipo en un corte. Ajusta los valores.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="grid gap-1.5 sm:col-span-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
            Resultado final
          </span>
          <select
            value={base}
            onChange={(e) => setBase(Number(e.target.value))}
            className="min-h-[42px] border border-line bg-void2 px-2 text-bone transition focus:border-teal focus:outline-none"
          >
            {BASE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <NumberField label="Mapas ganados" value={maps} min={0} max={30} onChange={setMaps} />
        <NumberField label="Series ganadas" value={series} min={0} max={15} onChange={setSeries} />
        <NumberField label="Rivales superiores" value={rivals} min={0} max={4} onChange={setRivals} />
        <label className="grid gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
            Consistencia
          </span>
          <select
            value={consistency}
            onChange={(e) => setConsistency(Number(e.target.value))}
            className="min-h-[42px] border border-line bg-void2 px-2 text-bone transition focus:border-teal focus:outline-none"
          >
            <option value={25}>Sin W.O. (+25)</option>
            <option value={0}>No aplica</option>
          </select>
        </label>
        <NumberField label="W.O." value={wo} min={0} max={5} onChange={setWo} />
        <NumberField label="Penalización" value={penalty} min={0} max={250} onChange={setPenalty} />
      </div>

      {/* Desglose */}
      <div className="mt-5 flex flex-wrap gap-1.5">
        {breakdown
          .filter((b) => b.v !== 0)
          .map((b) => (
            <span
              key={b.k}
              className={`hud-chip ${b.neg ? "text-brand" : "text-bone-dim"}`}
            >
              {b.k}: {b.neg ? "−" : "+"}
              {b.v}
            </span>
          ))}
      </div>

      <div className="mt-4 flex items-end justify-between border-l-2 border-teal bg-teal/5 px-4 py-3">
        <span className="font-head text-sm uppercase tracking-wide text-bone-dim">
          Puntos estimados
        </span>
        <span
          className={`font-display text-4xl ${
            total < 0 ? "text-brand text-glow-brand" : "text-teal text-glow-teal"
          }`}
        >
          {total}
        </span>
      </div>
    </div>
  );
}
