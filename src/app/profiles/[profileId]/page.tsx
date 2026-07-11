import { notFound } from "next/navigation";
import { getProfileUseCase, listRepertoiresUseCase } from "@/infrastructure/composition-root";
import { AppHeader } from "@/presentation/components/app-header";
import { RepertoireList } from "@/presentation/components/repertoire-list";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;
  const profile = await getProfileUseCase.execute(profileId);
  if (!profile) notFound();
  const repertoires = await listRepertoiresUseCase.execute(profileId);

  return (
    <>
      <AppHeader subtitle={profile.name} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="font-serif text-3xl font-semibold tracking-tight">
          Répertoires de {profile.name}
        </h1>
        <p className="mt-2 max-w-xl text-muted">
          Un répertoire par couleur et par système. Ouvrez-en un pour le travailler sur
          l&apos;échiquier.
        </p>
        <div className="mt-8">
          <RepertoireList
            profileId={profile.id}
            repertoires={repertoires.map((r) => ({
              id: r.id,
              name: r.name,
              side: r.side,
              moveCount: r.moveCount,
              updatedAt: r.updatedAt.toISOString(),
            }))}
          />
        </div>
      </main>
    </>
  );
}
