import type { Profile } from "@/domain/profile/profile";
import type { ProfileRepository } from "@/application/ports/profile-repository";

export class ListProfilesUseCase {
  constructor(private readonly profiles: ProfileRepository) {}

  async execute(): Promise<Profile[]> {
    const all = await this.profiles.list();
    return all.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
}
