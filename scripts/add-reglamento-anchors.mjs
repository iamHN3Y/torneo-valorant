// Migración de un solo uso: añade id="art-N" a cada contenedor de artículo
// (<div class="art">...) de public/reglamento.html, para permitir deep-links
// como /reglamento.html#art-43. Reemplaza los 3 ids nombrados preexistentes
// (sanciones, ranking-equipos, apelaciones) por su id numérico equivalente,
// ya que no se referencian en ningún otro lugar del repo. NO forma parte del
// build ni de scripts/db-setup.mjs — se ejecuta manualmente una sola vez.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, "..", "public", "reglamento.html");

const html = readFileSync(filePath, "utf8");

const artOpenRe = /<div class="art"(?: id="[^"]*")?><div class="num"><b>(\d{2})<\/b>/g;

let matchCount = 0;
const seen = new Set();
const updated = html.replace(artOpenRe, (full, num) => {
  matchCount++;
  if (seen.has(num)) {
    throw new Error(`id duplicado detectado para el artículo ${num}`);
  }
  seen.add(num);
  return `<div class="art" id="art-${Number(num)}"><div class="num"><b>${num}</b>`;
});

if (matchCount === 0) {
  throw new Error("No se encontró ningún <div class=\"art\">; el patrón pudo haber cambiado.");
}

// Regla CSS de resaltado para el artículo enlazado, coherente con el sistema
// visual existente (usa --teal, ya usado para bordes/resaltados en el propio
// documento). Se inserta justo antes del cierre de </style>.
const targetRule = `.art:target{border-left:3px solid var(--teal);background:rgba(25,232,200,.06);box-shadow:inset 0 0 0 1px rgba(25,232,200,.18)}\n`;

if (updated.includes(".art:target")) {
  throw new Error("La regla .art:target ya existe; aborta para no duplicarla.");
}

const styleCloseIdx = updated.indexOf("</style>");
if (styleCloseIdx === -1) {
  throw new Error("No se encontró </style> para insertar la regla .art:target.");
}

const final =
  updated.slice(0, styleCloseIdx) + targetRule + updated.slice(styleCloseIdx);

writeFileSync(filePath, final, "utf8");

console.log(`OK: ${matchCount} artículos anclados (art-1..art-${matchCount}). Regla .art:target añadida.`);
