import type { Player, Rama } from "./types";
import { rankPoints, ROSTER_RULES } from "./ranks";

/** Un requisito del reglamento con su estado de cumplimiento (para UI amable). */
export interface Requisito {
  id: string;
  label: string;
  ok: boolean;
  hint: string; // qué falta o cómo se cumple
  articulo: number; // artículo del reglamento que sustenta la regla
}

export interface ValidationResult {
  valido: boolean;
  errores: string[];
  avisos: string[];
  puntosTitulares: number;
  topePuntos: number | null; // null = sin tope (rama élite)
  requisitos: Requisito[];
}

/**
 * Valida un roster contra las reglas del reglamento:
 *  - Art. 12: 5 titulares + hasta 2 suplentes
 *  - Art. 16: tope de 30 pts (amateur), máx. 2 Inmortal, máx. 1 Radiante
 *  - Art. 11: mínimo 1 jugador de nacionalidad mexicana entre titulares
 */
export function validateRoster(
  jugadores: Player[],
  rama: Rama
): ValidationResult {
  const errores: string[] = [];
  const avisos: string[] = [];

  const titulares = jugadores.filter((j) => j.rol === "titular");
  const suplentes = jugadores.filter((j) => j.rol === "suplente");

  const puntosTitulares = titulares.reduce(
    (sum, j) => sum + rankPoints(j.rankId),
    0
  );
  const topePuntos = rama === "amateur" ? ROSTER_RULES.topePuntosAmateur : null;

  // Composición (Art. 12)
  if (titulares.length !== ROSTER_RULES.titularesRequeridos) {
    const faltan = ROSTER_RULES.titularesRequeridos - titulares.length;
    errores.push(
      faltan > 0
        ? `Faltan ${faltan} titular(es): tienes ${titulares.length} y se requieren exactamente ${ROSTER_RULES.titularesRequeridos}. Agrega jugadores con rol "titular" para completar la alineación (Art. 12).`
        : `Tienes ${titulares.length} titulares y solo se permiten ${ROSTER_RULES.titularesRequeridos}. Mueve el excedente a suplente o quítalo (Art. 12).`
    );
  }
  if (suplentes.length > ROSTER_RULES.suplentesMax) {
    errores.push(
      `Tienes ${suplentes.length} suplentes y el máximo permitido es ${ROSTER_RULES.suplentesMax}. Quita al suplente sobrante para continuar (Art. 12).`
    );
  }

  // Capitán (Art. 14)
  const capitanes = jugadores.filter((j) => j.esCapitan);
  if (capitanes.length === 0) {
    errores.push(
      "No hay ningún jugador marcado como capitán. Selecciona el radio \"Capitán\" junto a un titular para designarlo (Art. 14)."
    );
  } else if (capitanes.length > 1) {
    errores.push(
      `Hay ${capitanes.length} jugadores marcados como capitán y solo puede haber uno. Deja marcado solo a un jugador como capitán (Art. 14).`
    );
  }

  // Tope de puntos y límites por rango — Art. 16 (solo amateur)
  if (rama === "amateur") {
    if (puntosTitulares > ROSTER_RULES.topePuntosAmateur) {
      errores.push(
        `El roster suma ${puntosTitulares} pts y el tope amateur es ${ROSTER_RULES.topePuntosAmateur}. Baja de rango a alguno de tus titulares o cambia a la rama Élite (sin tope) para continuar (Art. 16).`
      );
    }
    const inmortales = titulares.filter((j) => j.rankId === "inmortal").length;
    const radiantes = titulares.filter((j) => j.rankId === "radiante").length;
    if (inmortales > ROSTER_RULES.maxInmortal) {
      errores.push(
        `Tienes ${inmortales} titulares Inmortal y el máximo en rama amateur es ${ROSTER_RULES.maxInmortal}. Cambia a alguno de rango o pasa el equipo a Élite (Art. 16).`
      );
    }
    if (radiantes > ROSTER_RULES.maxRadiante) {
      errores.push(
        `Tienes ${radiantes} titulares Radiante y el máximo en rama amateur es ${ROSTER_RULES.maxRadiante}. Cambia a alguno de rango o pasa el equipo a Élite (Art. 16).`
      );
    }
  }

  // Base nacional — Art. 11
  const mexicanos = titulares.filter((j) => j.nacionalidad === "MX").length;
  if (mexicanos < ROSTER_RULES.minMexicanos) {
    errores.push(
      `Ningún titular tiene nacionalidad mexicana registrada (se requiere al menos ${ROSTER_RULES.minMexicanos}). Marca la nacionalidad "México" en al menos un titular (Art. 11).`
    );
  }

  // Avisos (no bloquean, pero el cliente debe verlos)
  const sinVerificar = jugadores.filter((j) => !j.riotVerificado);
  if (sinVerificar.length > 0) {
    avisos.push(
      `${sinVerificar.length} jugador(es) con Riot ID sin verificar.`
    );
  }

  // Lista de requisitos para feedback amable (✓ / ✗)
  const inmortales = titulares.filter((j) => j.rankId === "inmortal").length;
  const radiantes = titulares.filter((j) => j.rankId === "radiante").length;

  const requisitos: Requisito[] = [
    {
      id: "titulares",
      label: "5 titulares",
      ok: titulares.length === ROSTER_RULES.titularesRequeridos,
      hint:
        titulares.length === ROSTER_RULES.titularesRequeridos
          ? "Alineación completa"
          : `Llevas ${titulares.length} de ${ROSTER_RULES.titularesRequeridos}. Agrega o quita titulares para cuadrar el número.`,
      articulo: 12,
    },
    {
      id: "capitan",
      label: "Un capitán designado",
      ok: capitanes.length === 1,
      hint:
        capitanes.length === 1
          ? "Listo"
          : capitanes.length === 0
            ? "Marca a un jugador como capitán"
            : "Hay más de uno marcado: deja solo a uno",
      articulo: 14,
    },
    {
      id: "mexicano",
      label: "Al menos 1 jugador mexicano",
      ok: mexicanos >= ROSTER_RULES.minMexicanos,
      hint:
        mexicanos >= ROSTER_RULES.minMexicanos
          ? `${mexicanos} en el roster`
          : "Base nacional obligatoria: marca 'México' en al menos un titular",
      articulo: 11,
    },
  ];

  if (rama === "amateur") {
    requisitos.push(
      {
        id: "tope",
        label: `Tope de ${ROSTER_RULES.topePuntosAmateur} puntos`,
        ok: puntosTitulares <= ROSTER_RULES.topePuntosAmateur,
        hint:
          puntosTitulares <= ROSTER_RULES.topePuntosAmateur
            ? `${puntosTitulares} / ${ROSTER_RULES.topePuntosAmateur} pts`
            : `${puntosTitulares} / ${ROSTER_RULES.topePuntosAmateur} pts: baja de rango a algún titular`,
        articulo: 16,
      },
      {
        id: "rangos",
        label: "Límites por rango",
        ok:
          inmortales <= ROSTER_RULES.maxInmortal &&
          radiantes <= ROSTER_RULES.maxRadiante,
        hint: `Máx. ${ROSTER_RULES.maxInmortal} Inmortal · ${ROSTER_RULES.maxRadiante} Radiante`,
        articulo: 16,
      }
    );
  }

  return {
    valido: errores.length === 0,
    errores,
    avisos,
    puntosTitulares,
    topePuntos,
    requisitos,
  };
}
