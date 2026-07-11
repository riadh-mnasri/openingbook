import type { RepertoireRepository } from "@/application/ports/repertoire-repository";

export class RenameRepertoireUseCase {
  constructor(private readonly repertoires: RepertoireRepository) {}

  async execute(id: string, name: string): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Le nom du répertoire est requis");
    const repertoire = await this.repertoires.findById(id);
    if (!repertoire) throw new Error("Répertoire introuvable");
    await this.repertoires.save({ ...repertoire, name: trimmed, updatedAt: new Date() });
  }
}
