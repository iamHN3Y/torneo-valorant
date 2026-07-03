import postgres from "postgres";

/**
 * Cliente Postgres (postgres.js) como singleton.
 *
 * - Se cachea en globalThis para no abrir conexiones nuevas en cada
 *   hot-reload de desarrollo.
 * - `prepare: false` para ser compatible con poolers de transacción
 *   (pgbouncer de Supabase / endpoint pooled de Neon) en serverless.
 * - La conexión es perezosa: no se conecta hasta la primera consulta, así
 *   que importar este módulo no falla aunque DATABASE_URL esté vacío
 *   (p. ej. durante `next build`).
 */
const globalForDb = globalThis as unknown as {
  sql?: ReturnType<typeof postgres>;
};

// Convierte columnas snake_case (BD) ↔ camelCase (JS) automáticamente.
const options = {
  ssl: "require" as const,
  prepare: false,
  idle_timeout: 20,
  max: 10,
  transform: postgres.camel,
};

export const sql =
  globalForDb.sql ??
  (process.env.DATABASE_URL
    ? postgres(process.env.DATABASE_URL, options)
    : postgres(options));

if (process.env.NODE_ENV !== "production") {
  globalForDb.sql = sql;
}

/** Lanza un error claro si la base de datos no está configurada. */
export function assertDbConfigured() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL no está configurada. Añádela en .env.local (ver README)."
    );
  }
}
