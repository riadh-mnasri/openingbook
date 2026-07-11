import {
  getRepertoireUseCase,
  removeRepertoireUseCase,
  renameRepertoireUseCase,
} from "@/infrastructure/composition-root";
import { errorResponse } from "../../api-helpers";

type Params = { params: Promise<{ repertoireId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { repertoireId } = await params;
  const view = await getRepertoireUseCase.execute(repertoireId);
  if (!view) return errorResponse(new Error("Répertoire introuvable"), 404);
  return Response.json(view);
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { repertoireId } = await params;
    const body = await request.json();
    await renameRepertoireUseCase.execute(repertoireId, body.name);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { repertoireId } = await params;
    await removeRepertoireUseCase.execute(repertoireId);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
