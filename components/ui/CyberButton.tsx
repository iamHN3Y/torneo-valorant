"use client";

import Link from "next/link";
import { useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";

/** Botón/enlace con ripple Material + glow neón. */
export default function CyberButton({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost";
  className?: string;
}) {
  const ref = useRef<HTMLAnchorElement>(null);

  function spawnRipple(e: React.PointerEvent<HTMLAnchorElement>) {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) return;
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

  return (
    <Link
      ref={ref}
      href={href}
      onPointerDown={spawnRipple}
      className={`cyber-btn ripple-host cyber-btn-${variant} ${className}`}
    >
      {children}
    </Link>
  );
}
