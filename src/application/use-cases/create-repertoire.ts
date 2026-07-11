import type { Repertoire, Side } from "@/domain/repertoire/repertoire";
import type { RepertoireRepository } from "@/application/ports/repertoire-repository";

export class CreateRepertoireUseCase {
  constructor(private readonly repertoires: RepertoireRepository) {}

  async execute(input: { profileId: string; name: string; side: Side }): Promise<Repertoire> {
    const name = input.name.trim();
    if (!name) throw new Error("Le nom du répertoire est requis");
    const now = new Date();
    const repertoire: Repertoire = {
      id: crypto.randomUUID(),
      profileId: input.profileId,
      name,
      side: input.side,
      createdAt: now,
      updatedAt: now,
    };
    await this.repertoires.save(repertoire);
    return repertoire;
  }
}
