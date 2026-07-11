import { normalizeFen } from "@/domain/repertoire/fen";
import type { RepertoireRepository } from "@/application/ports/repertoire-repository";

export class SavePositionNoteUseCase {
  constructor(private readonly repertoires: RepertoireRepository) {}

  async execute(input: { repertoireId: string; fen: string; note: string }): Promise<void> {
    await this.repertoires.saveNote(input.repertoireId, normalizeFen(input.fen), input.note.trim());
  }
}
