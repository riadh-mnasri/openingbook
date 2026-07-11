import type { PositionNote, Repertoire, RepertoireSummary } from "@/domain/repertoire/repertoire";
import type { MoveEdge } from "@/domain/repertoire/repertoire-graph";

export interface RepertoireRepository {
  save(repertoire: Repertoire): Promise<void>;
  listByProfile(profileId: string): Promise<RepertoireSummary[]>;
  findById(id: string): Promise<Repertoire | null>;
  remove(id: string): Promise<void>;

  listMoves(repertoireId: string): Promise<MoveEdge[]>;
  insertMove(repertoireId: string, edge: MoveEdge): Promise<void>;
  updateMoveAnnotation(
    repertoireId: string,
    edgeId: string,
    patch: { nag?: number | null; comment?: string | null },
  ): Promise<void>;
  deleteMoves(repertoireId: string, edgeIds: string[]): Promise<void>;
  updateRanks(repertoireId: string, ranks: { id: string; rank: number }[]): Promise<void>;

  listNotes(repertoireId: string): Promise<PositionNote[]>;
  // An empty note removes the entry.
  saveNote(repertoireId: string, fen: string, note: string): Promise<void>;
}
