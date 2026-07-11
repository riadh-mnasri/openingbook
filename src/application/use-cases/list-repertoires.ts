import type { RepertoireSummary } from "@/domain/repertoire/repertoire";
import type { RepertoireRepository } from "@/application/ports/repertoire-repository";

export class ListRepertoiresUseCase {
  constructor(private readonly repertoires: RepertoireRepository) {}

  async execute(profileId: string): Promise<RepertoireSummary[]> {
    const all = await this.repertoires.listByProfile(profileId);
    return all.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }
}
