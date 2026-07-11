import postgres from "postgres";

// Shared connection for every Postgres-backed repository. Neon's pooled
// connection string (DATABASE_URL) is safe to reuse across serverless
// invocations.
export const sql = postgres(process.env.DATABASE_URL ?? "", {
  ssl: "require",
});
