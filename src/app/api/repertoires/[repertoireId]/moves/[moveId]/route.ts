import {
  deleteMoveSubtreeUseCase,
  updateMoveAnnotationUseCase,
} from "@/infrastructure/composition-root";
import { errorResponse } from "../../../../api-helpers";

type Params = { params: Promise<{ repertoireId: string; moveId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { repertoireId, moveId } = await params;
    const body = await request.json();
    await updateMoveAnnotationUseCase.execute({ repertoireId, edgeId: moveId, ...body });
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { repertoireId, moveId } = await params;
    const deletedIds = await deleteMoveSubtreeUseCase.execute({ repertoireId, edgeId: moveId });
    return Response.json({ deletedIds });
  } catch (error) {
    return errorResponse(error);
  }
}
