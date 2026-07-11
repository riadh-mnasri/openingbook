import { createRepertoireUseCase, listRepertoiresUseCase } from "@/infrastructure/composition-root";
import { errorResponse } from "../api-helpers";

export async function GET(request: Request) {
  const profileId = new URL(request.url).searchParams.get("profileId");
  if (!profileId) return errorResponse(new Error("profileId est requis"));
  return Response.json(await listRepertoiresUseCase.execute(profileId));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const repertoire = await createRepertoireUseCase.execute({
      profileId: body.profileId,
      name: body.name,
      side: body.side,
    });
    return Response.json(repertoire, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
