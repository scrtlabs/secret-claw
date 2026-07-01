"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

interface NavAuthButtonsProps {
  size?: "sm" | "lg";
}

export function NavAuthButtons({ size = "sm" }: NavAuthButtonsProps) {
  const { status } = useSession();

  const btnBase =
    size === "sm"
      ? "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors"
      : "rounded-md px-5 py-2.5 text-sm font-semibold transition-colors";

  if (status === "loading") {
    return <div className={`${btnBase} w-24 animate-pulse bg-portal-border`} />;
  }

  if (status === "authenticated") {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/create-agent"
          className={`${btnBase} bg-portal-accent text-white hover:opacity-90`}
        >
          Launch wizard
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className={`${btnBase} border border-portal-border text-portal-muted hover:text-portal-text`}
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/sign-in"
      className={`${btnBase} border border-portal-border text-portal-text hover:bg-portal-surface`}
    >
      Sign in
    </Link>
  );
}
