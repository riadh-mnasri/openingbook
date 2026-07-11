import type { Profile } from "@/domain/profile/profile";
import type { ProfileRepository } from "@/application/ports/profile-repository";

export class GetProfileUseCase {
  constructor(private readonly profiles: ProfileRepository) {}

  async execute(id: string): Promise<Profile | null> {
    return this.profiles.findById(id);
  }
}
