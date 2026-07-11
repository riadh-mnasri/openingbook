import { removeProfileUseCase } from "@/infrastructure/composition-root";
import { errorResponse } from "../../api-helpers";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ profileId: string }> },
) {
  try {
    const { profileId } = await params;
    await removeProfileUseCase.execute(profileId);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
