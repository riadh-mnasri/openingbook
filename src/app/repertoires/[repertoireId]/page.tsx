import { notFound } from "next/navigation";
import { getRepertoireUseCase } from "@/infrastructure/composition-root";
import { RepertoireEditor } from "@/presentation/editor/repertoire-editor";

export const dynamic = "force-dynamic";

export default async function RepertoirePage({
  params,
}: {
  params: Promise<{ repertoireId: string }>;
}) {
  const { repertoireId } = await params;
  const view = await getRepertoireUseCase.execute(repertoireId);
  if (!view) notFound();

  return (
    <RepertoireEditor
      repertoire={{
        id: view.repertoire.id,
        profileId: view.repertoire.profileId,
        name: view.repertoire.name,
        side: view.repertoire.side,
      }}
      initialEdges={view.edges}
      initialNotes={view.notes}
    />
  );
}
