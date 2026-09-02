export function AppFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-3 text-center text-xs text-muted sm:px-6">
        © {new Date().getFullYear()}{" "}
        <a href="https://riadh-mnasri.pro" className="hover:text-accent-strong">
          Riadh MNASRI
        </a>
      </div>
    </footer>
  );
}
