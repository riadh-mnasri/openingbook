import Link from "next/link";

export function AppHeader({ subtitle }: { subtitle?: string }) {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl items-baseline gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-baseline gap-2">
          <span aria-hidden className="text-2xl leading-none text-accent-strong">
            ♞
          </span>
          <span className="font-serif text-xl font-semibold tracking-tight">OpeningBook</span>
        </Link>
        {subtitle ? <span className="truncate text-sm text-muted">{subtitle}</span> : null}
      </div>
    </header>
  );
}
