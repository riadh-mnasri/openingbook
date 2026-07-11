export type Side = "white" | "black";

export interface Repertoire {
  id: string;
  profileId: string;
  name: string;
  side: Side;
  createdAt: Date;
  updatedAt: Date;
}

export interface RepertoireSummary extends Repertoire {
  moveCount: number;
}

export interface PositionNote {
  fen: string;
  note: string;
}
