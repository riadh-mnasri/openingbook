import type { PositionNote, Repertoire } from "@/domain/repertoire/repertoire";
import type { MoveEdge } from "@/domain/repertoire/repertoire-graph";
import type { RepertoireRepository } from "@/application/ports/repertoire-repository";

export interface RepertoireGraphView {
  repertoire: Repertoire;
  edges: MoveEdge[];
  notes: PositionNote[];
}

export class GetRepertoireUseCase {
  constructor(private readonly repertoires: RepertoireRepository) {}

  async execute(id: string): Promise<RepertoireGraphView | null> {
    const repertoire = await this.repertoires.findById(id);
    if (!repertoire) return null;
    const [edges, notes] = await Promise.all([
      this.repertoires.listMoves(id),
      this.repertoires.listNotes(id),
    ]);
    return { repertoire, edges, notes };
  }
}
