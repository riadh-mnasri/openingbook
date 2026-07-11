import { edgeIdsToDelete } from "@/domain/repertoire/repertoire-graph";
import type { RepertoireRepository } from "@/application/ports/repertoire-repository";

export class DeleteMoveSubtreeUseCase {
  constructor(private readonly repertoires: RepertoireRepository) {}

  /**
   * Deletes a move and garbage-collects every continuation that becomes
   * unreachable from the root, while keeping lines still reachable
   * through a transposition. Returns the ids that were removed so the
   * client can update its local graph without refetching.
   */
  async execute(input: { repertoireId: string; edgeId: string }): Promise<string[]> {
    const edges = await this.repertoires.listMoves(input.repertoireId);
    const ids = edgeIdsToDelete(edges, input.edgeId);
    if (ids.length > 0) {
      await this.repertoires.deleteMoves(input.repertoireId, ids);
    }
    return ids;
  }
}
