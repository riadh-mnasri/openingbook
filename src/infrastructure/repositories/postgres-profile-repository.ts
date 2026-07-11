import type { Sql } from "postgres";
import type { Profile, ProfileColor } from "@/domain/profile/profile";
import type { ProfileRepository } from "@/application/ports/profile-repository";
import { ensureSchema } from "@/infrastructure/database/schema";

interface ProfileRow {
  id: string;
  name: string;
  color: string;
  created_at: Date;
}

function fromRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    name: row.name,
    color: row.color as ProfileColor,
    createdAt: row.created_at,
  };
}

export class PostgresProfileRepository implements ProfileRepository {
  constructor(private readonly sql: Sql) {}

  async save(profile: Profile): Promise<void> {
    await ensureSchema(this.sql);
    await this.sql`
      INSERT INTO profiles (id, name, color, created_at)
      VALUES (${profile.id}, ${profile.name}, ${profile.color}, ${profile.createdAt})
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, color = EXCLUDED.color`;
  }

  async list(): Promise<Profile[]> {
    await ensureSchema(this.sql);
    const rows = await this.sql<ProfileRow[]>`SELECT * FROM profiles`;
    return rows.map(fromRow);
  }

  async findById(id: string): Promise<Profile | null> {
    await ensureSchema(this.sql);
    const rows = await this.sql<ProfileRow[]>`SELECT * FROM profiles WHERE id = ${id}`;
    return rows.length > 0 ? fromRow(rows[0]) : null;
  }

  async remove(id: string): Promise<void> {
    await ensureSchema(this.sql);
    await this.sql`DELETE FROM profiles WHERE id = ${id}`;
  }
}
