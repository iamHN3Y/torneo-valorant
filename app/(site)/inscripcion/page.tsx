import Link from "next/link";
import { getActiveTournament } from "@/lib/repo";
import InscripcionForm, { type TorneoInfo } from "./InscripcionForm";

export const metadata = {
  title: "Inscripción · Copa México VALORANT 2026",
};

export default async function InscripcionPage() {
  let torneo: TorneoInfo = {
    hayTorneo: false,
    gratuito: true,
    cuota: "Por definir",
    nombre: "",
  };
  try {
    const t = await getActiveTournament();
    if (t && t.estado === "inscripciones") {
      torneo = {
        hayTorneo: true,
        gratuito: t.gratuito,
        cuota: t.cuota,
        nombre: t.nombre,
      };
    } else if (t) {
      // Torneo en curso: inscripciones cerradas.
      torneo = { ...torneo, nombre: t.nombre };
    }
  } catch {
    // BD no disponible: se muestra el aviso de cierre.
  }

  if (!torneo.hayTorneo) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16 text-center">
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-brand">
          // Inscripción de equipo
        </div>
        <h1 className="mt-2 font-display text-4xl uppercase sm:text-5xl">
          Inscripciones cerradas
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-bone-dim">
          {torneo.nombre
            ? `${torneo.nombre} ya está en curso y no admite nuevos equipos.`
            : "No hay un torneo con inscripciones abiertas en este momento."}{" "}
          Sigue los canales oficiales para enterarte de la próxima edición.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/bracket" className="cyber-btn cyber-btn-primary">
            Ver competición
          </Link>
          <Link href="/reglamento" className="cyber-btn cyber-btn-ghost">
            Leer reglamento
          </Link>
        </div>
      </div>
    );
  }

  return <InscripcionForm torneo={torneo} />;
}
