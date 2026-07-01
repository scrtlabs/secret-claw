import { SignOutButton } from "@/components/ui/SignOutButton";

interface PortalHeaderProps {
  pageTitle?: string;
}

export function PortalHeader({ pageTitle }: PortalHeaderProps) {
  return (
    <header className="border-b border-portal-border bg-portal-bg">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-portal-accent text-sm font-bold text-white">
            S
          </div>
          <span className="text-sm font-semibold tracking-tight text-portal-text">
            Secret AI Developer Portal
          </span>
        </div>
        {pageTitle ? (
          <span className="hidden text-sm font-medium text-portal-muted sm:inline">
            {pageTitle}
          </span>
        ) : null}
        <div className="flex items-center gap-4">
          <SignOutButton />
          <a
            href="https://secretai.scrtlabs.com"
            className="text-sm text-portal-muted transition-colors hover:text-portal-text"
          >
            Back to portal ↗
          </a>
        </div>
      </div>
    </header>
  );
}
