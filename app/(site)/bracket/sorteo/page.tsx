import Link from "next/link";
import { getActiveTournament, getGroupsWithTeams, type GroupWithTeams } from "@/lib/repo";
import DrawShow from "@/components/sorteo/DrawShow";

export const metadata = {
  title: "Sorteo de grupos · Copa México VALORANT 2026",
};

export default async function SorteoPage() {
  let groups: GroupWithTeams[] = [];
  let dbError = false;
  let noTournament = false;
  let pendiente = false;

  try {
    const tour = await getActiveTournament();
    if (!tour) {
      noTournament = true;
    } else if (!tour.sorteoPublicadoAt) {
      pendiente = true;
    } else {
      groups = await getGroupsWithTeams(tour.id);
      if (groups.length === 0 || groups.every((g) => g.teams.length === 0)) {
        pendiente = true;
      }
    }
  } catch {
    dbError = true;
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <Link
        href="/bracket"
        className="font-mono text-xs uppercase tracking-[0.3em] text-brand"
      >
        ← Volver a brackets
      </Link>
      <h1 className="mt-2 font-display text-4xl uppercase sm:text-5xl">
        Sorteo de grupos
      </h1>
      <p className="mt-3 max-w-2xl text-bone-dim">
        Revive la revelación de la fase de grupos. Los datos son públicos
        desde que el Comité publicó el sorteo; esto es una dramatización
        reproducible, no en tiempo real.
      </p>

      {dbError ? (
        <Notice text="No se pudo cargar el sorteo (base de datos no disponible)." />
      ) : noTournament ? (
        <Notice text="Aún no hay un torneo activo." />
      ) : pendiente ? (
        <Notice text="El sorteo aún no se ha publicado. Vuelve más tarde." />
      ) : (
        <div className="mt-10">
          <DrawShow groups={groups} />
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
