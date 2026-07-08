"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

interface NavAuthButtonsProps {
  size?: "sm" | "lg";
}

export function NavAuthButtons({ size = "sm" }: NavAuthButtonsProps) {
  const { data: session, status } = useSession();

  const base =
    size === "sm"
      ? "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors"
      : "rounded-md px-5 py-2.5 text-sm font-semibold transition-colors";

  if (status === "loading") {
    return <div className={`${base} w-24 animate-pulse`} style={{ background: "var(--forge)" }} />;
  }

  if (status === "authenticated") {
    const avatar = session?.user?.image;
    const name = session?.user?.name ?? session?.user?.email ?? "User";
    const initials = name.charAt(0).toUpperCase();

    return (
      <div className="flex items-center gap-2">
        {avatar ? (
          <Image
            src={avatar}
            alt={name}
            width={28}
            height={28}
            className="rounded-full border border-[var(--bronze)]"
          />
        ) : (
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--bronze)] text-xs font-bold"
            style={{ background: "var(--forge)", color: "var(--cast)" }}
          >
            {initials}
          </div>
        )}
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className={`${base} border border-[var(--bronze)] text-[var(--cast-dim)] hover:text-[var(--cast)]`}
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/sign-in"
      className={`${base} border border-[var(--bronze)] text-[var(--cast)] hover:bg-[var(--bronze)]/10`}
    >
      Sign in
    </Link>
  );
}
