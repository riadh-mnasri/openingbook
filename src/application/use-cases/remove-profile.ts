import type { ProfileRepository } from "@/application/ports/profile-repository";
import type { RepertoireRepository } from "@/application/ports/repertoire-repository";

export class RemoveProfileUseCase {
  constructor(
    private readonly profiles: ProfileRepository,
    private readonly repertoires: RepertoireRepository,
  ) {}

  async execute(id: string): Promise<void> {
    // Cascade explicitly so the JSON-file adapter behaves like the
    // Postgres foreign keys.
    const owned = await this.repertoires.listByProfile(id);
    for (const repertoire of owned) {
      await this.repertoires.remove(repertoire.id);
    }
    await this.profiles.remove(id);
  }
}
