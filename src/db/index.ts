import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
    // Small pool per server instance: many instances run at once on Vercel, and each one
    // holds its own connections. Use Neon's pooled connection string for the best result.
    max: 4,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });

// Without this listener, a dropped idle connection (Neon pauses idle databases) would
// crash the whole server process with an unhandled "error" event.
if (!globalForDb.__arenaNextJsPostgresqlPool) {
  pool.on("error", (error) => {
    console.error("Mindical database pool error:", error.message);
  });
}

globalForDb.__arenaNextJsPostgresqlPool = pool;

export const db = drizzle(pool);
