import path from "node:path";
import os from "node:os";
import type { ProfileRepository } from "@/application/ports/profile-repository";
import type { RepertoireRepository } from "@/application/ports/repertoire-repository";
import { JsonFileProfileRepository } from "@/infrastructure/repositories/json-file-profile-repository";
import { JsonFileRepertoireRepository } from "@/infrastructure/repositories/json-file-repertoire-repository";
import { PostgresProfileRepository } from "@/infrastructure/repositories/postgres-profile-repository";
import { PostgresRepertoireRepository } from "@/infrastructure/repositories/postgres-repertoire-repository";
import { sql } from "@/infrastructure/database/sql-client";
import { CreateProfileUseCase } from "@/application/use-cases/create-profile";
import { ListProfilesUseCase } from "@/application/use-cases/list-profiles";
import { GetProfileUseCase } from "@/application/use-cases/get-profile";
import { RemoveProfileUseCase } from "@/application/use-cases/remove-profile";
import { CreateRepertoireUseCase } from "@/application/use-cases/create-repertoire";
import { ListRepertoiresUseCase } from "@/application/use-cases/list-repertoires";
import { GetRepertoireUseCase } from "@/application/use-cases/get-repertoire";
import { RenameRepertoireUseCase } from "@/application/use-cases/rename-repertoire";
import { RemoveRepertoireUseCase } from "@/application/use-cases/remove-repertoire";
import { AddMoveUseCase } from "@/application/use-cases/add-move";
import { UpdateMoveAnnotationUseCase } from "@/application/use-cases/update-move-annotation";
import { DeleteMoveSubtreeUseCase } from "@/application/use-cases/delete-move-subtree";
import { PromoteMoveUseCase } from "@/application/use-cases/promote-move";
import { SavePositionNoteUseCase } from "@/application/use-cases/save-position-note";

// With DATABASE_URL set (Neon Postgres), repositories share a real
// database, consistent across serverless instances. Without it (local
// dev before any env pull), the app falls back to JSON files under
// .data/ for a zero-setup experience.
let profileRepository: ProfileRepository;
let repertoireRepository: RepertoireRepository;

if (process.env.DATABASE_URL) {
  profileRepository = new PostgresProfileRepository(sql);
  repertoireRepository = new PostgresRepertoireRepository(sql);
} else {
  const dataDir = process.env.VERCEL
    ? path.join(os.tmpdir(), "openingbook-data")
    : path.join(process.cwd(), ".data");
  profileRepository = new JsonFileProfileRepository(path.join(dataDir, "profiles.json"));
  repertoireRepository = new JsonFileRepertoireRepository(path.join(dataDir, "repertoires.json"));
}

export const createProfileUseCase = new CreateProfileUseCase(profileRepository);
export const listProfilesUseCase = new ListProfilesUseCase(profileRepository);
export const getProfileUseCase = new GetProfileUseCase(profileRepository);
export const removeProfileUseCase = new RemoveProfileUseCase(
  profileRepository,
  repertoireRepository,
);

export const createRepertoireUseCase = new CreateRepertoireUseCase(repertoireRepository);
export const listRepertoiresUseCase = new ListRepertoiresUseCase(repertoireRepository);
export const getRepertoireUseCase = new GetRepertoireUseCase(repertoireRepository);
export const renameRepertoireUseCase = new RenameRepertoireUseCase(repertoireRepository);
export const removeRepertoireUseCase = new RemoveRepertoireUseCase(repertoireRepository);

export const addMoveUseCase = new AddMoveUseCase(repertoireRepository);
export const updateMoveAnnotationUseCase = new UpdateMoveAnnotationUseCase(repertoireRepository);
export const deleteMoveSubtreeUseCase = new DeleteMoveSubtreeUseCase(repertoireRepository);
export const promoteMoveUseCase = new PromoteMoveUseCase(repertoireRepository);
export const savePositionNoteUseCase = new SavePositionNoteUseCase(repertoireRepository);
