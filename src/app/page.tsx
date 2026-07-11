import { listProfilesUseCase } from "@/infrastructure/composition-root";
import { AppHeader } from "@/presentation/components/app-header";
import { ProfileGrid } from "@/presentation/components/profile-grid";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const profiles = await listProfilesUseCase.execute();

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Qui joue ?</h1>
        <p className="mt-2 max-w-xl text-muted">
          Chaque joueur a ses propres répertoires d&apos;ouvertures, avec les Blancs et avec les
          Noirs.
        </p>
        <div className="mt-8">
          <ProfileGrid
            profiles={profiles.map(({ id, name, color }) => ({ id, name, color }))}
          />
        </div>
      </main>
    </>
  );
}
