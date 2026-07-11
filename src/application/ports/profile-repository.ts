import type { Profile } from "@/domain/profile/profile";

export interface ProfileRepository {
  save(profile: Profile): Promise<void>;
  list(): Promise<Profile[]>;
  findById(id: string): Promise<Profile | null>;
  remove(id: string): Promise<void>;
}
