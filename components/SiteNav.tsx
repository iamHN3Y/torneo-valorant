"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "@/app/ingresar/actions";

const PUBLIC_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/bracket", label: "Competición" },
  { href: "/ranking", label: "Ranking" },
  { href: "/reglamento", label: "Reglamento" },
];

type NavSession = { role: "team" | "co"; name: string } | null;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export default function SiteNav({ session }: { session: NavSession }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Enlaces según el rol
  const links = [...PUBLIC_LINKS];
  if (session?.role === "co") links.push({ href: "/admin", label: "Panel CO" });
  if (session?.role === "team") links.push({ href: "/equipo", label: "Mi equipo" });

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-void2/85 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Link href="/" className="group flex items-center gap-3">
          <span className="font-display text-xl leading-none tracking-wide transition group-hover:text-glow-teal">
            COPA<span className="text-brand">/</span>MX
          </span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.3em] text-muted sm:block">
            VALORANT 2026
          </span>
        </Link>

        {/* ---- Desktop ---- */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = isActive(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`relative px-3 py-2 font-head text-xs uppercase tracking-wider transition ${
                  active ? "text-teal" : "text-bone-dim hover:text-bone"
                }`}
              >
                {l.label}
                <span
                  className={`pointer-events-none absolute inset-x-3 -bottom-0.5 h-px bg-teal transition-all duration-300 ${
                    active ? "opacity-100" : "opacity-0"
                  }`}
                  style={{ boxShadow: active ? "0 0 8px var(--color-teal)" : "none" }}
                />
              </Link>
            );
          })}

          {session ? (
            <form action={logout} className="ml-2">
              <button className="border border-line px-3 py-2 font-head text-xs uppercase tracking-wider text-muted transition hover:border-brand hover:text-brand">
                Salir
              </button>
            </form>
          ) : (
            <>
              <Link
                href="/ingresar"
                className="ml-1 px-3 py-2 font-head text-xs uppercase tracking-wider text-bone-dim transition hover:text-bone"
              >
                Ingresar
              </Link>
              <Link
                href="/inscripcion"
                className="ripple-host clip-corner-tl ml-1 bg-brand px-4 py-2 font-head text-xs font-bold uppercase tracking-wider text-void transition hover:brightness-110 hover:[box-shadow:0_0_22px_rgba(255,70,85,.45)]"
              >
                Inscribir equipo
              </Link>
            </>
          )}
        </div>

        {/* ---- Botón hamburguesa (móvil) ---- */}
        <button
          type="button"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
          className="relative z-50 flex h-10 w-10 items-center justify-center border border-line bg-panel text-bone transition hover:border-teal md:hidden"
        >
          <span className="sr-only">Menú</span>
          <div className="flex flex-col items-center justify-center gap-[5px]">
            <span
              className={`block h-0.5 w-5 bg-current transition-all duration-300 ${
                open ? "translate-y-[7px] rotate-45" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-5 bg-current transition-all duration-300 ${
                open ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-5 bg-current transition-all duration-300 ${
                open ? "-translate-y-[7px] -rotate-45" : ""
              }`}
            />
          </div>
        </button>
      </nav>

      {/* ---- Overlay + panel móvil ---- */}
      <div
        className={`absolute left-0 right-0 top-full z-40 h-screen bg-void/70 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <div
        id="mobile-menu"
        className={`absolute inset-x-0 top-full z-40 origin-top border-b border-line bg-void2/95 backdrop-blur transition-all duration-300 md:hidden ${
          open
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-3 opacity-0"
        }`}
      >
        <div className="flex flex-col gap-1 px-5 py-4">
          {links.map((l) => {
            const active = isActive(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 border-l-2 px-4 py-3 font-head text-sm uppercase tracking-wider transition ${
                  active
                    ? "border-teal bg-teal/5 text-teal"
                    : "border-transparent text-bone-dim hover:border-line hover:bg-panel hover:text-bone"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    active ? "bg-teal shadow-[0_0_8px_var(--color-teal)]" : "bg-muted2"
                  }`}
                />
                {l.label}
              </Link>
            );
          })}

          {session ? (
            <form action={logout} className="mt-3">
              <button className="w-full border border-line px-4 py-3 text-center font-head text-sm uppercase tracking-wider text-muted transition hover:border-brand hover:text-brand">
                Salir ({session.name})
              </button>
            </form>
          ) : (
            <>
              <Link
                href="/ingresar"
                className="mt-3 border border-line px-4 py-3 text-center font-head text-sm uppercase tracking-wider text-bone-dim transition hover:border-teal hover:text-bone"
              >
                Ingresar
              </Link>
              <Link
                href="/inscripcion"
                className="clip-corner-tl mt-2 bg-brand px-4 py-3 text-center font-head text-sm font-bold uppercase tracking-wider text-void transition hover:brightness-110"
              >
                Inscribir equipo
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
