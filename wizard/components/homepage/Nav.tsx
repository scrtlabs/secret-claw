import { NavAuthButtons } from "@/components/ui/NavAuthButtons";

export default function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-portal-border bg-portal-bg/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-portal-accent text-sm font-bold text-white">
            SF
          </div>
          <span className="text-sm font-semibold tracking-tight text-portal-text">
            SecretForge
          </span>
        </div>
        <NavAuthButtons size="sm" />
      </div>
    </nav>
  );
}
