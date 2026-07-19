import { redirect } from "next/navigation";
import { requireTeam } from "@/lib/session";
import { getTeamById, getPlayers, getTournamentById } from "@/lib/repo";
import { validateRoster } from "@/lib/validation";
import { ESTADO_LABEL } from "@/lib/data";
import RosterEditor from "@/components/RosterEditor";
import GlitchText from "@/components/ui/GlitchText";
import { logout } from "@/app/ingresar/actions";

export const metadata = {
  title: "Mi equipo · Copa México VALORANT 2026",
};

export default async function EquipoPage() {
  const session = await requireTeam();

  const team = await getTeamById(session.id);
  if (!team) redirect("/ingresar");
  const players = await getPlayers(team.id);

  // El flujo depende de la modalidad del torneo: gratuito no tiene paso de pago.
  let gratuito = true;
  if (team.tournamentId) {
    try {
      const tour = await getTournamentById(team.tournamentId);
      if (tour) gratuito = tour.gratuito;
    } catch {
      // Sin dato del torneo: se asume gratuito (no muestra paso de pago).
    }
  }
  const FLOW = gratuito
    ? ["Registro", "Revisión", "Aprobado"]
    : ["Registro", "Pago", "Revisión", "Aprobado"];
  const FLOW_INDEX: Record<string, number> = gratuito
    ? { borrador: 0, pendiente_pago: 1, en_revision: 1, aprobado: 2 }
    : { borrador: 0, pendiente_pago: 1, en_revision: 2, aprobado: 3 };

  const validacion = validateRoster(players, team.rama);
  const est = ESTADO_LABEL[team.estado] ?? { label: team.estado, color: "text-muted" };
  const activeStep = FLOW_INDEX[team.estado] ?? -1;
  const isSideState =
    team.estado === "rechazado" || team.estado === "lista_espera";

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      {/* Encabezado */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-teal">
            // Panel de equipo
          </div>
          <h1 className="mt-2 font-display text-4xl uppercase sm:text-5xl">
            <GlitchText text={team.nombre} />
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="hud-chip text-bone-dim">#{team.tag}</span>
            <span className="hud-chip text-gold uppercase">{team.rama}</span>
            <span className={`hud-chip ${est.color}`}>{est.label}</span>
          </div>
        </div>
        <form action={logout}>
          <button className="cyber-btn cyber-btn-ghost text-xs">Salir</button>
        </form>
      </div>

      {/* Tu flujo */}
      <section className="mt-10">
        <div className="font-head text-sm font-semibold uppercase tracking-wide text-bone-dim">
          Tu flujo de inscripción
        </div>

        {isSideState ? (
          <div
            className={`mt-3 border-l-2 px-4 py-3 text-sm ${
              team.estado === "rechazado"
                ? "border-brand bg-brand/5 text-brand"
                : "border-muted bg-white/[0.02] text-bone-dim"
            }`}
          >
            {team.estado === "rechazado"
              ? "Tu inscripción fue rechazada por el Comité."
              : "Estás en lista de espera. Te avisaremos si se libera un cupo."}
            {team.notaCo && (
              <div className="mt-1 text-xs text-muted">Nota: {team.notaCo}</div>
            )}
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-stretch">
            {FLOW.map((label, i) => {
              const done = i < activeStep;
              const current = i === activeStep;
              return (
                <div key={label} className="flex flex-1 items-center gap-3">
                  <div
                    className={`flex flex-1 items-center gap-3 border px-4 py-3 ${
                      current
                        ? "border-teal bg-panel2 glow-teal"
                        : done
                          ? "border-line bg-panel"
                          : "border-line/60 bg-panel/50"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center font-display ${
                        current
                          ? "bg-teal text-void"
                          : done
                            ? "bg-teal/20 text-teal"
                            : "bg-void2 text-muted"
                      }`}
                      style={{ clipPath: "polygon(7px 0,100% 0,100% 100%,0 100%,0 7px)" }}
                    >
                      {done ? "✓" : i + 1}
                    </span>
                    <span
                      className={`font-head text-sm font-semibold uppercase tracking-wide ${
                        current ? "text-bone" : "text-bone-dim"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  {i < FLOW.length - 1 && (
                    <span
                      aria-hidden
                      className={`hidden h-px w-5 self-center sm:block ${
                        done ? "bg-teal" : "bg-muted2"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Métricas rápidas */}
      <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Titulares" value={`${players.filter((p) => p.rol === "titular").length}/5`} />
        <Stat label="Suplentes" value={`${players.filter((p) => p.rol === "suplente").length}/2`} />
        <Stat
          label="Puntos"
          value={`${validacion.puntosTitulares}${validacion.topePuntos ? `/${validacion.topePuntos}` : ""}`}
          color={validacion.valido ? "text-teal" : "text-gold"}
        />
        <Stat
          label="Roster"
          value={team.rosterLocked ? "Bloqueado" : validacion.valido ? "Válido" : "Incompleto"}
          color={team.rosterLocked ? "text-gold" : validacion.valido ? "text-teal" : "text-muted"}
        />
      </section>

      {/* Editor de roster */}
      <section className="mt-12">
        <div className="mb-4 font-head text-xl font-semibold uppercase tracking-wide">
          Roster
        </div>
        <RosterEditor
          initialPlayers={players}
          rama={team.rama}
          locked={team.rosterLocked}
        />
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  color = "text-bone",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="surface clip-corner p-4">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted">
        {label}
      </div>
      <div className={`mt-1 font-display text-2xl ${color}`}>{value}</div>
    </div>
  );
}
