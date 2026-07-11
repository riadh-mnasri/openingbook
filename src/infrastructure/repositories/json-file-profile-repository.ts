import type { Profile } from "@/domain/profile/profile";
import type { ProfileRepository } from "@/application/ports/profile-repository";
import { readJsonFile, writeJsonFile } from "./json-file-store";

type StoredProfile = Omit<Profile, "createdAt"> & { createdAt: string };

export class JsonFileProfileRepository implements ProfileRepository {
  constructor(private readonly filePath: string) {}

  private async readAll(): Promise<StoredProfile[]> {
    return readJsonFile<StoredProfile[]>(this.filePath, []);
  }

  async save(profile: Profile): Promise<void> {
    const all = await this.readAll();
    const stored: StoredProfile = { ...profile, createdAt: profile.createdAt.toISOString() };
    const index = all.findIndex((p) => p.id === profile.id);
    if (index >= 0) all[index] = stored;
    else all.push(stored);
    await writeJsonFile(this.filePath, all);
  }

  async list(): Promise<Profile[]> {
    const all = await this.readAll();
    return all.map((p) => ({ ...p, createdAt: new Date(p.createdAt) }));
  }

  async findById(id: string): Promise<Profile | null> {
    const all = await this.list();
    return all.find((p) => p.id === id) ?? null;
  }

  async remove(id: string): Promise<void> {
    const all = await this.readAll();
    await writeJsonFile(
      this.filePath,
      all.filter((p) => p.id !== id),
    );
  }
}
