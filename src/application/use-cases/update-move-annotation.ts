import type { RepertoireRepository } from "@/application/ports/repertoire-repository";

export class UpdateMoveAnnotationUseCase {
  constructor(private readonly repertoires: RepertoireRepository) {}

  async execute(input: {
    repertoireId: string;
    edgeId: string;
    nag?: number | null;
    comment?: string | null;
  }): Promise<void> {
    const patch: { nag?: number | null; comment?: string | null } = {};
    if ("nag" in input) patch.nag = input.nag ?? null;
    if ("comment" in input) {
      const comment = input.comment?.trim() ?? "";
      patch.comment = comment === "" ? null : comment;
    }
    await this.repertoires.updateMoveAnnotation(input.repertoireId, input.edgeId, patch);
  }
}
