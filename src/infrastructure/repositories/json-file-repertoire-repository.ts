import type { PositionNote, Repertoire, RepertoireSummary } from "@/domain/repertoire/repertoire";
import type { MoveEdge } from "@/domain/repertoire/repertoire-graph";
import type { RepertoireRepository } from "@/application/ports/repertoire-repository";
import { readJsonFile, writeJsonFile } from "./json-file-store";

type StoredRepertoire = Omit<Repertoire, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

interface StoredEntry {
  repertoire: StoredRepertoire;
  edges: MoveEdge[];
  notes: PositionNote[];
}

function toRepertoire(stored: StoredRepertoire): Repertoire {
  return {
    ...stored,
    createdAt: new Date(stored.createdAt),
    updatedAt: new Date(stored.updatedAt),
  };
}

export class JsonFileRepertoireRepository implements RepertoireRepository {
  constructor(private readonly filePath: string) {}

  private async readAll(): Promise<StoredEntry[]> {
    return readJsonFile<StoredEntry[]>(this.filePath, []);
  }

  private async writeAll(entries: StoredEntry[]): Promise<void> {
    await writeJsonFile(this.filePath, entries);
  }

  private async withEntry(
    repertoireId: string,
    mutate: (entry: StoredEntry) => void,
  ): Promise<void> {
    const all = await this.readAll();
    const entry = all.find((e) => e.repertoire.id === repertoireId);
    if (!entry) return;
    mutate(entry);
    await this.writeAll(all);
  }

  async save(repertoire: Repertoire): Promise<void> {
    const all = await this.readAll();
    const stored: StoredRepertoire = {
      ...repertoire,
      createdAt: repertoire.createdAt.toISOString(),
      updatedAt: repertoire.updatedAt.toISOString(),
    };
    const entry = all.find((e) => e.repertoire.id === repertoire.id);
    if (entry) entry.repertoire = stored;
    else all.push({ repertoire: stored, edges: [], notes: [] });
    await this.writeAll(all);
  }

  async listByProfile(profileId: string): Promise<RepertoireSummary[]> {
    const all = await this.readAll();
    return all
      .filter((e) => e.repertoire.profileId === profileId)
      .map((e) => ({ ...toRepertoire(e.repertoire), moveCount: e.edges.length }));
  }

  async findById(id: string): Promise<Repertoire | null> {
    const all = await this.readAll();
    const entry = all.find((e) => e.repertoire.id === id);
    return entry ? toRepertoire(entry.repertoire) : null;
  }

  async remove(id: string): Promise<void> {
    const all = await this.readAll();
    await this.writeAll(all.filter((e) => e.repertoire.id !== id));
  }

  async listMoves(repertoireId: string): Promise<MoveEdge[]> {
    const all = await this.readAll();
    return all.find((e) => e.repertoire.id === repertoireId)?.edges ?? [];
  }

  async insertMove(repertoireId: string, edge: MoveEdge): Promise<void> {
    await this.withEntry(repertoireId, (entry) => {
      const exists = entry.edges.some(
        (e) => e.parentFen === edge.parentFen && e.uci === edge.uci,
      );
      if (!exists) entry.edges.push(edge);
    });
  }

  async updateMoveAnnotation(
    repertoireId: string,
    edgeId: string,
    patch: { nag?: number | null; comment?: string | null },
  ): Promise<void> {
    await this.withEntry(repertoireId, (entry) => {
      const edge = entry.edges.find((e) => e.id === edgeId);
      if (!edge) return;
      if ("nag" in patch) edge.nag = patch.nag ?? null;
      if ("comment" in patch) edge.comment = patch.comment ?? null;
    });
  }

  async deleteMoves(repertoireId: string, edgeIds: string[]): Promise<void> {
    const ids = new Set(edgeIds);
    await this.withEntry(repertoireId, (entry) => {
      entry.edges = entry.edges.filter((e) => !ids.has(e.id));
    });
  }

  async updateRanks(repertoireId: string, ranks: { id: string; rank: number }[]): Promise<void> {
    const byId = new Map(ranks.map((r) => [r.id, r.rank]));
    await this.withEntry(repertoireId, (entry) => {
      for (const edge of entry.edges) {
        const rank = byId.get(edge.id);
        if (rank !== undefined) edge.rank = rank;
      }
    });
  }

  async listNotes(repertoireId: string): Promise<PositionNote[]> {
    const all = await this.readAll();
    return all.find((e) => e.repertoire.id === repertoireId)?.notes ?? [];
  }

  async saveNote(repertoireId: string, fen: string, note: string): Promise<void> {
    await this.withEntry(repertoireId, (entry) => {
      entry.notes = entry.notes.filter((n) => n.fen !== fen);
      if (note !== "") entry.notes.push({ fen, note });
    });
  }
}
