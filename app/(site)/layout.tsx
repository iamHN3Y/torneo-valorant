import { cookies } from "next/headers";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { getSession } from "@/lib/session";
import { MOTION_COOKIE, type MotionPref } from "@/lib/motion";

/**
 * Layout del grupo "site": envuelve todas las páginas públicas/panel con la
 * navegación y el footer globales. La ruta de transmisión (/marcador) vive
 * fuera de este grupo para no heredar esta chrome.
 */
export default async function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  const navSession = session
    ? { role: session.role, name: session.name }
    : null;

  const motionCookie = (await cookies()).get(MOTION_COOKIE)?.value;
  const motionPref: MotionPref =
    motionCookie === "reduced" || motionCookie === "full" ? motionCookie : "auto";

  return (
    <>
      <SiteNav session={navSession} motionPref={motionPref} />
      <main className="relative z-10 flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
