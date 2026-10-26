/**
 * Layout del grupo "marcador": sin SiteNav/SiteFooter, para poder poner esta
 * ruta en pantalla/OBS limpia. El root layout (app/layout.tsx) sigue siendo
 * el único <html>/<body>; aquí solo pasamos los children directamente.
 */
export default function MarcadorLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <main className="relative z-10 min-h-full">{children}</main>;
}
