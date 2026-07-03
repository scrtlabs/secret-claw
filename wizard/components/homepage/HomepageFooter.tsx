export default function HomepageFooter() {
  return (
    <footer className="border-t border-portal-border py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-portal-muted sm:flex-row">
        <span>© 2026 SecretForge · Powered by SecretVM</span>
        <div className="flex items-center gap-4">
          <a href="#" className="transition-colors hover:text-portal-text">
            Privacy policy
          </a>
          <a href="#" className="transition-colors hover:text-portal-text">
            Docs
          </a>
        </div>
      </div>
    </footer>
  );
}
