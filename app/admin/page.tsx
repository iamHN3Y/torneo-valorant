import { requireCo } from "@/lib/session";
import { listTeams, listTournaments, type DbTeam, type DbTournament } from "@/lib/repo";
import { logout } from "@/app/ingresar/actions";
import Reveal from "@/components/ui/Reveal";
import CountUp from "@/components/ui/CountUp";
import TiltCard from "@/components/ui/TiltCard";
import AdminTeams from "@/components/admin/AdminTeams";
import TournamentsPanel from "@/components/admin/TournamentsPanel";

export const metadata = {
  title: "Panel CO · Copa México VALORANT 2026",
};

export default async function AdminPage() {
  const session = await requireCo();

  let teams: DbTeam[] = [];
  let tournaments: DbTournament[] = [];
  let dbError = false;
  try {
    [teams, tournaments] = await Promise.all([listTeams(), listTournaments()]);
  } catch {
    dbError = true;
  }

  const aprobados = teams.filter((t) => t.estado === "aprobado").length;
  const enRevision = teams.filter((t) => t.estado === "en_revision").length;
  const espera = teams.filter((t) => t.estado === "lista_espera").length;

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-gold">
            // Comité Organizador · {session.name}
          </div>
          <h1 className="mt-2 font-display text-4xl uppercase sm:text-5xl">
            Panel de control
          </h1>
        </div>
        <form action={logout}>
          <button className="cyber-btn cyber-btn-ghost text-xs">Salir</button>
        </form>
      </div>

      {dbError ? (
        <div className="mt-8 surface surface-brand clip-corner-tl p-6">
          <div className="font-head text-sm font-semibold uppercase tracking-widest text-brand">
            ◆ Base de datos no configurada
          </div>
          <p className="mt-2 text-sm text-bone-dim">
            Falta <code className="text-teal">DATABASE_URL</code> o la BD no está
            inicializada. Corre <code className="text-teal">npm run db:setup</code>.
          </p>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <Reveal className="mt-8">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              <Kpi label="Equipos" value={teams.length} />
              <Kpi label="Aprobados" value={aprobados} color="text-teal" />
              <Kpi label="En revisión" value={enRevision} color="text-gold" />
              <Kpi label="Lista de espera" value={espera} color="text-muted" />
            </div>
          </Reveal>

          {/* Torneos */}
          <Reveal delay={80} className="mt-8">
            <TournamentsPanel tournaments={tournaments} />
          </Reveal>

          {/* Equipos */}
          <section className="mt-10">
            <Reveal>
              <h2 className="font-head text-xl font-semibold uppercase tracking-wide">
                Equipos inscritos
              </h2>
              <p className="mt-1 text-sm text-muted">
                Cambia el estado, bloquea el roster (Art. 13) o deja una nota
                visible para el equipo.
              </p>
            </Reveal>
            <Reveal delay={100} className="mt-5">
              <AdminTeams teams={teams} />
            </Reveal>
          </section>
        </>
      )}
    </div>
  );
}

function Kpi({
  label,
  value,
  color = "text-bone",
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <TiltCard max={6} className="surface clip-corner p-4">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted">
        {label}
      </div>
      <div className={`mt-1 font-display text-3xl ${color}`}>
        <CountUp to={value} />
      </div>
    </TiltCard>
  );
}
