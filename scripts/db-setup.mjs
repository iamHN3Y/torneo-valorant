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
  if (exists.length) {
    // El equipo ya existía (posiblemente de antes de Fase 5, con el accent
    // default): igual aplicamos el accent del seed para que la demo siempre
    // muestre 4 acentos distintos, sin tocar nada más de la fila.
    await sql`update team set accent = ${t.accent} where id = ${exists[0].id}`;
    return { id: exists[0].id, nuevo: false };
  }

  const [team] = await sql`
    insert into team (tournament_id, nombre, tag, rama, estado, password_hash, orden_inscripcion, accent)
    values (${tournamentId}, ${t.nombre}, ${t.tag}, ${t.rama}, ${t.estado}, ${hash(t.password)}, ${t.orden}, ${t.accent})
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
      accent: "violeta",
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
      estado: "aprobado",
      orden: 2,
      accent: "lima",
      password: "quetzal123",
      players: [
        player("Aldo", "Aldo#MX1", "diamante", { cap: true }),
        player("Memo", "Memo#MX2", "platino"),
        player("Nico", "Nico#MX3", "platino"),
        player("Rulo", "Rulo#MX4", "hierro_oro"),
        player("Sam", "Sam#MX5", "ascendente"),
      ],
    },
    {
      nombre: "Aztlan",
      tag: "AZT",
      rama: "elite",
      estado: "aprobado",
      orden: 3,
      accent: "cobalto",
      password: "aztlan123",
      players: [
        player("Rex", "Rex#MX1", "inmortal", { cap: true }),
        player("Neo", "Neo#MX2", "inmortal"),
        player("Ivo", "Ivo#MX3", "ascendente"),
        player("Leo", "Leo#MX4", "ascendente"),
        player("Uri", "Uri#MX5", "diamante"),
      ],
    },
    {
      nombre: "Norte",
      tag: "NWV",
      rama: "elite",
      estado: "aprobado",
      orden: 4,
      accent: "rosa",
      password: "norte123",
      players: [
        player("Van", "Van#MX1", "radiante", { cap: true }),
        player("Tom", "Tom#MX2", "inmortal"),
        player("Rob", "Rob#MX3", "ascendente"),
        player("Gus", "Gus#MX4", "diamante"),
        player("Hal", "Hal#MX5", "diamante"),
      ],
    },
  ];

  const teamIds = {};
  for (const t of teams) {
    const { id, nuevo } = await seedTeam(tour.id, t);
    teamIds[t.tag] = id;
    console.log(`${nuevo ? "✓ creado" : "· ya existía"}: ${t.nombre}#${t.tag}`);
  }

  // 5) Fase competitiva demo (grupo A + partidos), idempotente.
  const [{ count: gcount }] = await sql`
    select count(*)::int as count from tournament_group where tournament_id = ${tour.id}
  `;
  if (Number(gcount) === 0) {
    const [grp] = await sql`
      insert into tournament_group (tournament_id, nombre, orden)
      values (${tour.id}, 'A', 0) returning id
    `;
    const inGroup = ["JAG", "AZT", "NWV", "QTZ"];
    for (const tag of inGroup) {
      await sql`
        insert into tournament_group_team (group_id, team_id)
        values (${grp.id}, ${teamIds[tag]}) on conflict do nothing
      `;
    }

    const seedMatch = (groupId, ronda, aTag, bTag, sa, sb, estado, orden) =>
      sql`
        insert into tournament_match
          (tournament_id, group_id, ronda, formato, team_a_id, team_b_id, score_a, score_b, estado, orden)
        values
          (${tour.id}, ${groupId}, ${ronda}, 'Bo3',
           ${aTag ? teamIds[aTag] : null}, ${bTag ? teamIds[bTag] : null},
           ${sa}, ${sb}, ${estado}, ${orden})
      `;

    // Partidos de grupo (finalizados)
    await seedMatch(grp.id, "Grupo A", "JAG", "QTZ", 2, 0, "finalizado", 1);
    await seedMatch(grp.id, "Grupo A", "AZT", "NWV", 2, 1, "finalizado", 2);
    await seedMatch(grp.id, "Grupo A", "JAG", "NWV", 2, 1, "finalizado", 3);
    await seedMatch(grp.id, "Grupo A", "AZT", "QTZ", 2, 0, "finalizado", 4);
    await seedMatch(grp.id, "Grupo A", "JAG", "AZT", 0, 0, "en_vivo", 5);

    // Playoffs (sin grupo)
    await sql`
      insert into tournament_match
        (tournament_id, group_id, ronda, formato, team_a_id, team_b_id, estado, orden)
      values
        (${tour.id}, null, 'Semifinal', 'Bo3', ${teamIds["JAG"]}, ${teamIds["AZT"]}, 'programado', 1),
        (${tour.id}, null, 'Gran Final', 'Bo5', null, null, 'programado', 2)
    `;
    console.log("✓ grupo A + partidos sembrados");
  } else {
    console.log("· fase competitiva ya existía");
  }

  console.log("\n=== Credenciales de prueba ===");
  console.log(`Comité (CO):   usuario "${CO_USER}"  ·  contraseña "${CO_PASS}"`);
  console.log(`Equipo:        "Jaguares#JAG"  ·  contraseña "jaguares123"`);
  console.log(`Equipo:        "Quetzal#QTZ"   ·  contraseña "quetzal123"`);
  console.log(`Equipo:        "Aztlan#AZT"    ·  contraseña "aztlan123"`);
  console.log(`Equipo:        "Norte#NWV"     ·  contraseña "norte123"`);
  console.log("\n✓ Listo.");
} catch (err) {
  console.error("✗ Error en el setup:", err.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
