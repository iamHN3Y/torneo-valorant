"use client";

import { useId, useState } from "react";

export interface AccordionItem {
  step: string;
  title: string;
  body: string;
  href?: string;
  cta?: string;
}

/**
 * Acordeón Material para mostrar la información poco a poco (no de golpe).
 * Solo un panel abierto a la vez; el primero arranca abierto.
 */
export default function Accordion({ items }: { items: AccordionItem[] }) {
  const [open, setOpen] = useState(0);
  const uid = useId();

  return (
    <div className="flex flex-col gap-3">
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div
            key={it.title}
            className={`surface clip-corner-tl overflow-hidden ${
              isOpen ? "glow-teal" : ""
            }`}
          >
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={`${uid}-panel-${i}`}
              onClick={() => setOpen(isOpen ? -1 : i)}
              className="ripple-host flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-white/[0.02]"
            >
              <span
                className={`font-display text-2xl leading-none transition-colors ${
                  isOpen ? "text-teal text-glow-teal" : "text-muted"
                }`}
              >
                {it.step}
              </span>
              <span className="flex-1 font-head text-base font-semibold uppercase tracking-wide text-bone">
                {it.title}
              </span>
              <span
                className={`font-mono text-lg text-teal transition-transform duration-300 ${
                  isOpen ? "rotate-45" : ""
                }`}
                aria-hidden
              >
                +
              </span>
            </button>
            <div
              id={`${uid}-panel-${i}`}
              className="grid transition-all duration-300 ease-out"
              style={{
                gridTemplateRows: isOpen ? "1fr" : "0fr",
              }}
            >
              <div className="overflow-hidden">
                <div className="border-t border-line/60 px-5 py-4 text-sm leading-relaxed text-bone-dim">
                  {it.body}
                  {it.href && it.cta && (
                    <a
                      href={it.href}
                      className="mt-3 inline-flex items-center gap-1 font-head text-xs font-bold uppercase tracking-wider text-teal transition hover:text-glow-teal"
                    >
                      {it.cta} →
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
