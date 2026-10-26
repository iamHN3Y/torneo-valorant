import type { Metadata } from "next";
import { Anton, Oswald, Barlow, JetBrains_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { MOTION_COOKIE, type MotionPref } from "@/lib/motion";

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

/**
 * Root layout: solo <html>/<body>, fuentes y el atributo data-motion (que
 * debe vivir en <html>, por lo que su cookie se lee aquí). La navegación,
 * el footer y la sesión del CO/equipo se resuelven en app/(site)/layout.tsx
 * para que la ruta pública /marcador (fuera del grupo "site") no los herede.
 */
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const motionCookie = (await cookies()).get(MOTION_COOKIE)?.value;
  const motionPref: MotionPref =
    motionCookie === "reduced" || motionCookie === "full" ? motionCookie : "auto";

  return (
    <html
      lang="es-MX"
      data-scroll-behavior="smooth"
      {...(motionPref !== "auto" ? { "data-motion": motionPref } : {})}
      className={`${anton.variable} ${oswald.variable} ${barlow.variable} ${jetmono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-void text-bone font-sans">
        <div className="grid-bg" aria-hidden />
        <div className="scanline-overlay" aria-hidden />
        {children}
      </body>
    </html>
  );
}
