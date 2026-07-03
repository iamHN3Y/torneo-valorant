import type { Metadata } from "next";
import { Anton, Oswald, Barlow, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { getSession } from "@/lib/session";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton" });
const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald" });
const barlow = Barlow({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-barlow",
});
const jetmono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetmono" });

export const metadata: Metadata = {
  title: "Copa México VALORANT 2026 · Portal Oficial",
  description:
    "Portal oficial del torneo comunitario Copa México VALORANT 2026: registro de equipos, brackets, calendario y ranking nacional.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  const navSession = session
    ? { role: session.role, name: session.name }
    : null;
  return (
    <html
      lang="es-MX"
      data-scroll-behavior="smooth"
      className={`${anton.variable} ${oswald.variable} ${barlow.variable} ${jetmono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-void text-bone font-sans">
        <div className="grid-bg" aria-hidden />
        <div className="scanline-overlay" aria-hidden />
        <SiteNav session={navSession} />
        <main className="relative z-10 flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
