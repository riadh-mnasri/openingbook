import { promotionRanks } from "@/domain/repertoire/repertoire-graph";
import type { RepertoireRepository } from "@/application/ports/repertoire-repository";

export class PromoteMoveUseCase {
  constructor(private readonly repertoires: RepertoireRepository) {}

  // Makes the move the main choice of its position (rank 0).
  async execute(input: { repertoireId: string; edgeId: string }): Promise<{ id: string; rank: number }[]> {
    const edges = await this.repertoires.listMoves(input.repertoireId);
    const ranks = promotionRanks(edges, input.edgeId);
    if (ranks.length > 0) {
      await this.repertoires.updateRanks(input.repertoireId, ranks);
    }
    return ranks;
  }
}
