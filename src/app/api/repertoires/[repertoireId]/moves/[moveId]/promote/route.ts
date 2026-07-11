import { promoteMoveUseCase } from "@/infrastructure/composition-root";
import { errorResponse } from "../../../../../api-helpers";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ repertoireId: string; moveId: string }> },
) {
  try {
    const { repertoireId, moveId } = await params;
    const ranks = await promoteMoveUseCase.execute({ repertoireId, edgeId: moveId });
    return Response.json({ ranks });
  } catch (error) {
    return errorResponse(error);
  }
}
