import type { Player, Rama } from "./types";
import { rankPoints, ROSTER_RULES } from "./ranks";

/** Un requisito del reglamento con su estado de cumplimiento (para UI amable). */
export interface Requisito {
  id: string;
  label: string;
  ok: boolean;
  hint: string; // qué falta o cómo se cumple
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
    errores.push(
      `Se requieren exactamente ${ROSTER_RULES.titularesRequeridos} titulares (hay ${titulares.length}).`
    );
  }
  if (suplentes.length > ROSTER_RULES.suplentesMax) {
    errores.push(
      `Máximo ${ROSTER_RULES.suplentesMax} suplentes (hay ${suplentes.length}).`
    );
  }

  // Capitán (Art. 14)
  const capitanes = jugadores.filter((j) => j.esCapitan);
  if (capitanes.length === 0) {
    errores.push("Debe designarse un capitán.");
  } else if (capitanes.length > 1) {
    errores.push("Solo puede haber un capitán.");
  }

  // Tope de puntos y límites por rango — Art. 16 (solo amateur)
  if (rama === "amateur") {
    if (puntosTitulares > ROSTER_RULES.topePuntosAmateur) {
      errores.push(
        `El roster suma ${puntosTitulares} pts y el tope amateur es ${ROSTER_RULES.topePuntosAmateur}.`
      );
    }
    const inmortales = titulares.filter((j) => j.rankId === "inmortal").length;
    const radiantes = titulares.filter((j) => j.rankId === "radiante").length;
    if (inmortales > ROSTER_RULES.maxInmortal) {
      errores.push(
        `Máximo ${ROSTER_RULES.maxInmortal} jugadores Inmortal (hay ${inmortales}).`
      );
    }
    if (radiantes > ROSTER_RULES.maxRadiante) {
      errores.push(
        `Máximo ${ROSTER_RULES.maxRadiante} jugador Radiante (hay ${radiantes}).`
      );
    }
  }

  // Base nacional — Art. 11
  const mexicanos = titulares.filter((j) => j.nacionalidad === "MX").length;
  if (mexicanos < ROSTER_RULES.minMexicanos) {
    errores.push(
      `Al menos ${ROSTER_RULES.minMexicanos} titular debe ser de nacionalidad mexicana.`
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
          : `Llevas ${titulares.length} de ${ROSTER_RULES.titularesRequeridos}`,
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
            : "Solo puede haber uno",
    },
    {
      id: "mexicano",
      label: "Al menos 1 jugador mexicano",
      ok: mexicanos >= ROSTER_RULES.minMexicanos,
      hint:
        mexicanos >= ROSTER_RULES.minMexicanos
          ? `${mexicanos} en el roster`
          : "Base nacional obligatoria (Art. 11)",
    },
  ];

  if (rama === "amateur") {
    requisitos.push(
      {
        id: "tope",
        label: `Tope de ${ROSTER_RULES.topePuntosAmateur} puntos`,
        ok: puntosTitulares <= ROSTER_RULES.topePuntosAmateur,
        hint: `${puntosTitulares} / ${ROSTER_RULES.topePuntosAmateur} pts`,
      },
      {
        id: "rangos",
        label: "Límites por rango",
        ok:
          inmortales <= ROSTER_RULES.maxInmortal &&
          radiantes <= ROSTER_RULES.maxRadiante,
        hint: `Máx. ${ROSTER_RULES.maxInmortal} Inmortal · ${ROSTER_RULES.maxRadiante} Radiante`,
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
