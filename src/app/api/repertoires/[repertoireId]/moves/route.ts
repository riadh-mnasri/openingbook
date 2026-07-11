import { addMoveUseCase } from "@/infrastructure/composition-root";
import { errorResponse } from "../../../api-helpers";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ repertoireId: string }> },
) {
  try {
    const { repertoireId } = await params;
    const body = await request.json();
    const edge = await addMoveUseCase.execute({
      repertoireId,
      parentFen: body.parentFen,
      uci: body.uci,
    });
    return Response.json(edge, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
