import CyberButton from "@/components/ui/CyberButton";
import type { DbMatch } from "@/lib/repo";

function fecha(f: string | null) {
  if (!f) return "Fecha por confirmar";
  return new Date(f).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" });
}

/**
 * Bloque "Tu próxima misión": solo se monta desde app/page.tsx si hay
 * sesión de equipo. Muestra el próximo partido del equipo logueado.
 */
export default function ProximaMision({
  match,
  teamId,
}: {
  match: DbMatch | null;
  teamId: string;
}) {
  const rival = match
    ? match.teamAId === teamId
      ? { nombre: match.teamBNombre, tag: match.teamBTag }
      : { nombre: match.teamANombre, tag: match.teamATag }
    : null;

  return (
    <section className="mt-16">
      <div className="font-mono text-xs uppercase tracking-[0.3em] text-teal">
        // Tu próxima misión
      </div>
      <div className="surface surface-gold clip-corner-tl mt-4 p-6">
        {match && rival ? (
          <>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted">
              {match.estado === "en_vivo" && (
                <span className="h-1.5 w-1.5 rounded-full bg-brand anim-flicker" />
              )}
              {match.estado === "en_vivo" ? "En vivo ahora" : "Próximo partido"}
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <span className="font-head text-xl font-semibold text-bone">
                vs {rival.nombre ?? "Rival por definir"}
                {rival.tag && (
                  <span className="ml-2 font-mono text-xs text-muted">[{rival.tag}]</span>
                )}
              </span>
              <span className="hud-chip text-gold">{match.ronda}</span>
            </div>
            <div className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted">
              {match.formato} · {fecha(match.fecha)}
            </div>
          </>
        ) : (
          <p className="text-sm text-bone-dim">
            No tienes partidos programados por el momento. Te avisaremos aquí
            en cuanto el Comité publique tu próximo cruce.
          </p>
        )}
        <div className="mt-4">
          <CyberButton href="/equipo" variant="ghost">
            Ir a mi equipo
          </CyberButton>
        </div>
      </div>
    </section>
  );
}
