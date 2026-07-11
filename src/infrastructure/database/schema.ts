import type { Sql } from "postgres";

let schemaReady: Promise<void> | null = null;

// Idempotent, lazily-run schema creation shared by the Postgres
// repositories (the tables reference each other, so they are created
// together). No separate migration step is needed.
export function ensureSchema(sql: Sql): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS profiles (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          color TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL
        )`;
      await sql`
        CREATE TABLE IF NOT EXISTS repertoires (
          id TEXT PRIMARY KEY,
          profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          side TEXT NOT NULL CHECK (side IN ('white', 'black')),
          created_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL
        )`;
      await sql`
        CREATE TABLE IF NOT EXISTS repertoire_moves (
          id TEXT PRIMARY KEY,
          repertoire_id TEXT NOT NULL REFERENCES repertoires(id) ON DELETE CASCADE,
          parent_fen TEXT NOT NULL,
          uci TEXT NOT NULL,
          san TEXT NOT NULL,
          child_fen TEXT NOT NULL,
          rank INT NOT NULL,
          nag SMALLINT,
          comment TEXT,
          UNIQUE (repertoire_id, parent_fen, uci)
        )`;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_repertoire_moves_repertoire
        ON repertoire_moves (repertoire_id)`;
      await sql`
        CREATE TABLE IF NOT EXISTS position_notes (
          repertoire_id TEXT NOT NULL REFERENCES repertoires(id) ON DELETE CASCADE,
          fen TEXT NOT NULL,
          note TEXT NOT NULL,
          PRIMARY KEY (repertoire_id, fen)
        )`;
    })();
  }
  return schemaReady;
}
