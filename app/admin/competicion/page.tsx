import Link from "next/link";
import { requireCo } from "@/lib/session";
import {
  getActiveTournament,
  listTeams,
  getGroupsWithTeams,
  getAllMatches,
  listRankingAdjustments,
  type DbMatch,
  type GroupWithTeams,
  type DbRankingAdjustment,
} from "@/lib/repo";
import CompeticionManager from "@/components/admin/CompeticionManager";

export const metadata = {
  title: "Competición · Panel CO",
};

export default async function AdminCompeticionPage() {
  await requireCo();

  let teams: { id: string; nombre: string; tag: string }[] = [];
  let groups: GroupWithTeams[] = [];
  let matches: DbMatch[] = [];
  let adjustments: DbRankingAdjustment[] = [];
  let dbError = false;
  let noTournament = false;

  try {
    const tour = await getActiveTournament();
    if (!tour) {
      noTournament = true;
    } else {
      const [allTeams, g, m, adj] = await Promise.all([
        listTeams(tour.id),
        getGroupsWithTeams(tour.id),
        getAllMatches(tour.id),
        listRankingAdjustments(),
      ]);
      teams = allTeams
        .filter((t) => t.estado !== "rechazado")
        .map((t) => ({ id: t.id, nombre: t.nombre, tag: t.tag }));
      groups = g;
      matches = m;
      adjustments = adj;
    }
  } catch {
    dbError = true;
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-gold">
            // Comité · Competición
          </div>
          <h1 className="mt-2 font-display text-4xl uppercase sm:text-5xl">
            Grupos y partidos
          </h1>
        </div>
        <Link
          href="/admin"
          className="cyber-btn cyber-btn-ghost text-xs"
        >
          ← Panel
        </Link>
      </div>

      {dbError ? (
        <Notice text="Base de datos no disponible." />
      ) : noTournament ? (
        <Notice text="No hay un torneo activo. Márcalo como “Inscripciones” o “En curso” en el panel." />
      ) : (
        <div className="mt-10">
          <CompeticionManager
            teams={teams}
            groups={groups}
            matches={matches}
            adjustments={adjustments}
          />
        </div>
      )}
    </div>
  );
}

function Notice({ text }: { text: string }) {
  return (
    <div className="surface clip-corner mt-8 p-6 text-center text-sm text-muted">
      {text}
    </div>
  );
}
