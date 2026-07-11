import type { Profile, ProfileColor } from "@/domain/profile/profile";
import { PROFILE_COLORS } from "@/domain/profile/profile";
import type { ProfileRepository } from "@/application/ports/profile-repository";

export class CreateProfileUseCase {
  constructor(private readonly profiles: ProfileRepository) {}

  async execute(input: { name: string; color?: ProfileColor }): Promise<Profile> {
    const name = input.name.trim();
    if (!name) throw new Error("Le nom du profil est requis");
    const profile: Profile = {
      id: crypto.randomUUID(),
      name,
      color: input.color ?? PROFILE_COLORS[0],
      createdAt: new Date(),
    };
    await this.profiles.save(profile);
    return profile;
  }
}
