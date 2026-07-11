import type { Sql } from "postgres";
import type { PositionNote, Repertoire, RepertoireSummary, Side } from "@/domain/repertoire/repertoire";
import type { MoveEdge } from "@/domain/repertoire/repertoire-graph";
import type { RepertoireRepository } from "@/application/ports/repertoire-repository";
import { ensureSchema } from "@/infrastructure/database/schema";

interface RepertoireRow {
  id: string;
  profile_id: string;
  name: string;
  side: string;
  created_at: Date;
  updated_at: Date;
}

interface MoveRow {
  id: string;
  parent_fen: string;
  uci: string;
  san: string;
  child_fen: string;
  rank: number;
  nag: number | null;
  comment: string | null;
}

function fromRepertoireRow(row: RepertoireRow): Repertoire {
  return {
    id: row.id,
    profileId: row.profile_id,
    name: row.name,
    side: row.side as Side,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function fromMoveRow(row: MoveRow): MoveEdge {
  return {
    id: row.id,
    parentFen: row.parent_fen,
    uci: row.uci,
    san: row.san,
    childFen: row.child_fen,
    rank: row.rank,
    nag: row.nag,
    comment: row.comment,
  };
}

export class PostgresRepertoireRepository implements RepertoireRepository {
  constructor(private readonly sql: Sql) {}

  async save(repertoire: Repertoire): Promise<void> {
    await ensureSchema(this.sql);
    await this.sql`
      INSERT INTO repertoires (id, profile_id, name, side, created_at, updated_at)
      VALUES (${repertoire.id}, ${repertoire.profileId}, ${repertoire.name},
              ${repertoire.side}, ${repertoire.createdAt}, ${repertoire.updatedAt})
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = EXCLUDED.updated_at`;
  }

  async listByProfile(profileId: string): Promise<RepertoireSummary[]> {
    await ensureSchema(this.sql);
    const rows = await this.sql<(RepertoireRow & { move_count: string })[]>`
      SELECT r.*, COUNT(m.id) AS move_count
      FROM repertoires r
      LEFT JOIN repertoire_moves m ON m.repertoire_id = r.id
      WHERE r.profile_id = ${profileId}
      GROUP BY r.id`;
    return rows.map((row) => ({ ...fromRepertoireRow(row), moveCount: Number(row.move_count) }));
  }

  async findById(id: string): Promise<Repertoire | null> {
    await ensureSchema(this.sql);
    const rows = await this.sql<RepertoireRow[]>`SELECT * FROM repertoires WHERE id = ${id}`;
    return rows.length > 0 ? fromRepertoireRow(rows[0]) : null;
  }

  async remove(id: string): Promise<void> {
    await ensureSchema(this.sql);
    await this.sql`DELETE FROM repertoires WHERE id = ${id}`;
  }

  async listMoves(repertoireId: string): Promise<MoveEdge[]> {
    await ensureSchema(this.sql);
    const rows = await this.sql<MoveRow[]>`
      SELECT id, parent_fen, uci, san, child_fen, rank, nag, comment
      FROM repertoire_moves WHERE repertoire_id = ${repertoireId}`;
    return rows.map(fromMoveRow);
  }

  async insertMove(repertoireId: string, edge: MoveEdge): Promise<void> {
    await ensureSchema(this.sql);
    await this.sql`
      INSERT INTO repertoire_moves
        (id, repertoire_id, parent_fen, uci, san, child_fen, rank, nag, comment)
      VALUES (${edge.id}, ${repertoireId}, ${edge.parentFen}, ${edge.uci}, ${edge.san},
              ${edge.childFen}, ${edge.rank}, ${edge.nag}, ${edge.comment})
      ON CONFLICT (repertoire_id, parent_fen, uci) DO NOTHING`;
  }

  async updateMoveAnnotation(
    repertoireId: string,
    edgeId: string,
    patch: { nag?: number | null; comment?: string | null },
  ): Promise<void> {
    await ensureSchema(this.sql);
    if ("nag" in patch) {
      await this.sql`
        UPDATE repertoire_moves SET nag = ${patch.nag ?? null}
        WHERE repertoire_id = ${repertoireId} AND id = ${edgeId}`;
    }
    if ("comment" in patch) {
      await this.sql`
        UPDATE repertoire_moves SET comment = ${patch.comment ?? null}
        WHERE repertoire_id = ${repertoireId} AND id = ${edgeId}`;
    }
  }

  async deleteMoves(repertoireId: string, edgeIds: string[]): Promise<void> {
    await ensureSchema(this.sql);
    await this.sql`
      DELETE FROM repertoire_moves
      WHERE repertoire_id = ${repertoireId} AND id IN ${this.sql(edgeIds)}`;
  }

  async updateRanks(repertoireId: string, ranks: { id: string; rank: number }[]): Promise<void> {
    await ensureSchema(this.sql);
    await this.sql.begin(async (tx) => {
      for (const { id, rank } of ranks) {
        await tx`
          UPDATE repertoire_moves SET rank = ${rank}
          WHERE repertoire_id = ${repertoireId} AND id = ${id}`;
      }
    });
  }

  async listNotes(repertoireId: string): Promise<PositionNote[]> {
    await ensureSchema(this.sql);
    const rows = await this.sql<{ fen: string; note: string }[]>`
      SELECT fen, note FROM position_notes WHERE repertoire_id = ${repertoireId}`;
    return rows;
  }

  async saveNote(repertoireId: string, fen: string, note: string): Promise<void> {
    await ensureSchema(this.sql);
    if (note === "") {
      await this.sql`
        DELETE FROM position_notes WHERE repertoire_id = ${repertoireId} AND fen = ${fen}`;
      return;
    }
    await this.sql`
      INSERT INTO position_notes (repertoire_id, fen, note)
      VALUES (${repertoireId}, ${fen}, ${note})
      ON CONFLICT (repertoire_id, fen) DO UPDATE SET note = EXCLUDED.note`;
  }
}
