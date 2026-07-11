import { createProfileUseCase, listProfilesUseCase } from "@/infrastructure/composition-root";
import { errorResponse } from "../api-helpers";

export async function GET() {
  return Response.json(await listProfilesUseCase.execute());
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const profile = await createProfileUseCase.execute({ name: body.name, color: body.color });
    return Response.json(profile, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
