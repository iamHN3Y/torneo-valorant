// Crea las tablas y siembra datos de ejemplo.
// Ejecuta:  npm run db:setup   (carga .env.local automáticamente)
import postgres from "postgres";
import { readFileSync } from "node:fs";
import { scryptSync, randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Mismo formato que lib/auth.ts: scrypt$saltHex$hashHex (keylen 64). */
function hash(pw) {
  const salt = randomBytes(16);
  const derived = scryptSync(pw.normalize(), salt, 64);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("✗ Falta DATABASE_URL. Configúrala en .env.local.");
  process.exit(1);
}

const sql = postgres(url, { ssl: "require", prepare: false, onnotice: () => {} });

function player(nombre, riot, rank, { cap = false, nac = "MX", rol = "titular" } = {}) {
  return {
    nombre,
    riot_id: riot,
    rank_id: rank,
    nacionalidad: nac,
    rol,
    es_capitan: cap,
    riot_verificado: false,
  };
}

async function seedTeam(tournamentId, t) {
  const exists = await sql`
    select id from team
    where lower(nombre) = lower(${t.nombre}) and lower(tag) = lower(${t.tag})
    limit 1
  `;
  if (exists.length) return { id: exists[0].id, nuevo: false };

  const [team] = await sql`
    insert into team (tournament_id, nombre, tag, rama, estado, password_hash, orden_inscripcion)
    values (${tournamentId}, ${t.nombre}, ${t.tag}, ${t.rama}, ${t.estado}, ${hash(t.password)}, ${t.orden})
    returning id
  `;
  const rows = t.players.map((p, i) => ({ team_id: team.id, ...p, orden: i }));
  await sql`insert into player ${sql(
    rows,
    "team_id",
    "nombre",
    "riot_id",
    "rank_id",
    "nacionalidad",
    "rol",
    "es_capitan",
    "riot_verificado",
    "orden"
  )}`;
  return { id: team.id, nuevo: true };
}

try {
  // 1) Esquema (idempotente).
  const schema = readFileSync(join(__dirname, "..", "db", "schema.sql"), "utf8");
  for (const stmt of schema.split(";").map((s) => s.trim()).filter(Boolean)) {
    await sql.unsafe(stmt);
  }
  console.log("✓ Esquema aplicado");

  // 2) Usuario del Comité Organizador.
  const CO_USER = "comite";
  const CO_PASS = "admin1234";
  await sql`
    insert into co_user (username, password_hash, nombre)
    values (${CO_USER}, ${hash(CO_PASS)}, 'Comité Organizador')
    on conflict (username) do nothing
  `;

  // 3) Torneo activo.
  let [tour] = await sql`
    select id from tournament where estado in ('inscripciones','en_curso')
    order by created_at desc limit 1
  `;
  if (!tour) {
    [tour] = await sql`
      insert into tournament (nombre, estado, cupo_max)
      values ('Copa México VALORANT 2026', 'inscripciones', 64)
      returning id
    `;
  }

  // 4) Equipos demo (para probar login).
  const teams = [
    {
      nombre: "Jaguares",
      tag: "JAG",
      rama: "elite",
      estado: "aprobado",
      orden: 1,
      password: "jaguares123",
      players: [
        player("Bruno", "Bruno#MX1", "radiante", { cap: true }),
        player("Kique", "Kique#MX2", "inmortal"),
        player("Tavo", "Tavo#MX3", "inmortal"),
        player("Dann", "Dann#MX4", "ascendente"),
        player("Zeta", "Zeta#MX5", "diamante"),
      ],
    },
    {
      nombre: "Quetzal",
      tag: "QTZ",
      rama: "amateur",
      estado: "en_revision",
      orden: 2,
      password: "quetzal123",
      players: [
        player("Aldo", "Aldo#MX1", "diamante", { cap: true }),
        player("Memo", "Memo#MX2", "platino"),
        player("Nico", "Nico#MX3", "platino"),
        player("Rulo", "Rulo#MX4", "hierro_oro"),
        player("Sam", "Sam#MX5", "ascendente"),
      ],
    },
  ];

  for (const t of teams) {
    const { nuevo } = await seedTeam(tour.id, t);
    console.log(`${nuevo ? "✓ creado" : "· ya existía"}: ${t.nombre}#${t.tag}`);
  }

  console.log("\n=== Credenciales de prueba ===");
  console.log(`Comité (CO):   usuario "${CO_USER}"  ·  contraseña "${CO_PASS}"`);
  console.log(`Equipo:        "Jaguares#JAG"  ·  contraseña "jaguares123"`);
  console.log(`Equipo:        "Quetzal#QTZ"   ·  contraseña "quetzal123"`);
  console.log("\n✓ Listo.");
} catch (err) {
  console.error("✗ Error en el setup:", err.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
