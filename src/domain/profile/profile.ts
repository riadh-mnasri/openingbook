export const PROFILE_COLORS = ["green", "wood", "slate", "gold"] as const;
export type ProfileColor = (typeof PROFILE_COLORS)[number];

export interface Profile {
  id: string;
  name: string;
  color: ProfileColor;
  createdAt: Date;
}
