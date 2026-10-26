export const metadata = {
  title: "Reglamento · Copa México VALORANT 2026",
};

/** Cantidad total de artículos anclados en public/reglamento.html (id="art-N"). */
const MAX_ARTICULO = 50;

function parseArticulo(raw: string | undefined): number | null {
  if (!raw) return null;
  if (!/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > MAX_ARTICULO) return null;
  return n;
}

export default async function ReglamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ art?: string }>;
}) {
  const { art: artRaw } = await searchParams;
  const art = parseArticulo(artRaw);
  const src = art ? `/reglamento.html#art-${art}` : "/reglamento.html";

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-brand">
            // Documento normativo
          </div>
          <h1 className="mt-2 font-display text-5xl uppercase">Reglamento oficial</h1>
        </div>
        <a
          href="/reglamento.html"
          target="_blank"
          rel="noopener noreferrer"
          className="clip-corner-tl border border-line bg-panel px-4 py-2 font-head text-xs font-bold uppercase tracking-wider text-bone transition hover:border-teal"
        >
          Abrir en pestaña nueva ↗
        </a>
      </div>

      <p className="mt-3 max-w-2xl text-bone-dim">
        Reglamento general, operativo y disciplinario — Edición I · v1.3. Incluye
        buscador, simulador de veto, calculadora de ranking y exportación a PDF.
      </p>

      <div className="mt-8 overflow-hidden border border-line">
        <iframe
          key={art ?? "base"}
          src={src}
          title="Reglamento Copa México VALORANT 2026"
          className="h-[80vh] w-full bg-white"
        />
      </div>
    </div>
  );
}
