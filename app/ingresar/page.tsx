import LoginForm from "@/components/LoginForm";
import GlitchText from "@/components/ui/GlitchText";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Ingresar · Copa México VALORANT 2026",
};

export default async function IngresarPage({
  searchParams,
}: {
  searchParams: Promise<{ co?: string }>;
}) {
  // Si ya hay sesión, manda a su panel.
  const session = await getSession();
  if (session?.role === "team") redirect("/equipo");
  if (session?.role === "co") redirect("/admin");

  const { co } = await searchParams;

  return (
    <div className="mx-auto flex max-w-md flex-col px-5 py-16">
      <div className="text-center">
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-brand">
          // Acceso
        </div>
        <h1 className="mt-2 font-display text-4xl uppercase sm:text-5xl">
          <GlitchText text="Ingresar" />
        </h1>
        <p className="mt-2 text-sm text-bone-dim">
          Entra a tu panel de equipo o al del Comité Organizador.
        </p>
      </div>

      <div className="mt-8">
        <LoginForm defaultCo={co === "1"} />
      </div>
    </div>
  );
}
