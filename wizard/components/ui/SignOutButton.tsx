"use client";

import { useSession, signOut } from "next-auth/react";

export function SignOutButton() {
  const { status } = useSession();
  if (status !== "authenticated") return null;

  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-sm text-portal-muted transition-colors hover:text-portal-text"
    >
      Sign out
    </button>
  );
}
