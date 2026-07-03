import { NextResponse } from "next/server";

/**
 * Verificación de Riot ID vía ACCOUNT-V1.
 *
 * La API key NUNCA se expone al cliente: vive en RIOT_API_KEY (.env.local)
 * y solo se usa aquí, en el servidor.
 *
 * POST { gameName: string, tagLine: string }
 *  -> { exists: true, puuid, gameName, tagLine }
 *  -> { exists: false }                         (cuenta no encontrada)
 *  -> { error: string }                         (key faltante / inválida / fallo)
 */

// account-v1 usa enrutamiento regional: americas | europe | asia.
// Para LATAM-N / México corresponde "americas".
const ACCOUNT_HOST = "https://americas.api.riotgames.com";

export async function POST(req: Request) {
  const apiKey = process.env.RIOT_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "RIOT_API_KEY no configurada en el servidor." },
      { status: 500 }
    );
  }

  let body: { gameName?: string; tagLine?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const gameName = body.gameName?.trim();
  const tagLine = body.tagLine?.trim().replace(/^#/, "");

  if (!gameName || !tagLine) {
    return NextResponse.json(
      { error: "Falta gameName o tagLine (formato Nombre#TAG)." },
      { status: 400 }
    );
  }

  const url = `${ACCOUNT_HOST}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(
    gameName
  )}/${encodeURIComponent(tagLine)}`;

  try {
    const res = await fetch(url, {
      headers: { "X-Riot-Token": apiKey },
      // Sin caché: la verificación debe ser en vivo.
      cache: "no-store",
    });

    if (res.status === 404) {
      return NextResponse.json({ exists: false });
    }
    if (res.status === 401 || res.status === 403) {
      return NextResponse.json(
        { error: "API key inválida o expirada (regenera la development key)." },
        { status: 502 }
      );
    }
    if (res.status === 429) {
      return NextResponse.json(
        { error: "Límite de peticiones alcanzado. Intenta de nuevo en un momento." },
        { status: 429 }
      );
    }
    if (!res.ok) {
      return NextResponse.json(
        { error: `Riot respondió ${res.status}.` },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      puuid: string;
      gameName: string;
      tagLine: string;
    };

    return NextResponse.json({
      exists: true,
      puuid: data.puuid,
      gameName: data.gameName,
      tagLine: data.tagLine,
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo contactar a la API de Riot." },
      { status: 502 }
    );
  }
}
