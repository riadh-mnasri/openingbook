import { Chess } from "chess.js";
import { normalizeFen, toFullFen } from "@/domain/repertoire/fen";
import { findEdge, nextRank, type MoveEdge } from "@/domain/repertoire/repertoire-graph";
import type { RepertoireRepository } from "@/application/ports/repertoire-repository";

export class AddMoveUseCase {
  constructor(private readonly repertoires: RepertoireRepository) {}

  /**
   * Adds a move played from parentFen. The move is replayed server-side
   * so SAN and the child position are always derived from a legal move,
   * whatever the client sent. Returns the existing edge unchanged when
   * the move is already in the repertoire.
   */
  async execute(input: { repertoireId: string; parentFen: string; uci: string }): Promise<MoveEdge> {
    const repertoire = await this.repertoires.findById(input.repertoireId);
    if (!repertoire) throw new Error("Répertoire introuvable");

    const parentFen = normalizeFen(input.parentFen);
    const chess = new Chess(toFullFen(parentFen));
    const move = chess.move({
      from: input.uci.slice(0, 2),
      to: input.uci.slice(2, 4),
      promotion: input.uci.slice(4, 5) || undefined,
    });

    const edges = await this.repertoires.listMoves(input.repertoireId);
    const existing = findEdge(edges, parentFen, input.uci);
    if (existing) return existing;

    const edge: MoveEdge = {
      id: crypto.randomUUID(),
      parentFen,
      uci: input.uci,
      san: move.san,
      childFen: normalizeFen(chess.fen()),
      rank: nextRank(edges, parentFen),
      nag: null,
      comment: null,
    };
    await this.repertoires.insertMove(input.repertoireId, edge);
    await this.repertoires.save({ ...repertoire, updatedAt: new Date() });
    return edge;
  }
}
