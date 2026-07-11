import type { RepertoireRepository } from "@/application/ports/repertoire-repository";

export class RemoveRepertoireUseCase {
  constructor(private readonly repertoires: RepertoireRepository) {}

  async execute(id: string): Promise<void> {
    await this.repertoires.remove(id);
  }
}
