import { savePositionNoteUseCase } from "@/infrastructure/composition-root";
import { errorResponse } from "../../../api-helpers";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ repertoireId: string }> },
) {
  try {
    const { repertoireId } = await params;
    const body = await request.json();
    await savePositionNoteUseCase.execute({ repertoireId, fen: body.fen, note: body.note ?? "" });
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
