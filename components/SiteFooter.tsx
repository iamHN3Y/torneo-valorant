export default function SiteFooter() {
  return (
    <footer className="relative z-10 mt-24 border-t border-line">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="font-display text-2xl uppercase">
          Copa<span className="text-brand">/</span>México VALORANT 2026
        </div>
        <p className="mt-3 max-w-xl text-sm text-muted">
          Portal del torneo comunitario. Documento normativo controlado por el
          Comité Organizador. Prevalece la versión publicada en los canales
          oficiales.
        </p>
        <p className="mt-5 font-mono text-[10px] uppercase tracking-wider text-muted2">
          VALORANT © Riot Games, Inc. · Torneo comunitario independiente — no
          afiliado, patrocinado ni avalado por Riot Games · Operado bajo las
          VALORANT Community Competition Guidelines.
        </p>
      </div>
    </footer>
  );
}
