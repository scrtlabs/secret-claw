"use client";

import { useRef, useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

interface NavAuthButtonsProps {
  size?: "sm" | "lg";
}

export function NavAuthButtons({ size = "sm" }: NavAuthButtonsProps) {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

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
        <Link
          href="/agents"
          className={`${base} border border-[var(--bronze)] text-[var(--cast-dim)] hover:text-[var(--cast)]`}
        >
          Dashboard
        </Link>

        {/* Avatar + dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            aria-label="Account menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="flex items-center focus:outline-none"
          >
            {avatar ? (
              <Image
                src={avatar}
                alt={name}
                width={28}
                height={28}
                className="rounded-full border border-[var(--bronze)] cursor-pointer hover:opacity-80 transition-opacity"
              />
            ) : (
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--bronze)] text-xs font-bold cursor-pointer hover:opacity-80 transition-opacity"
                style={{ background: "var(--forge)", color: "var(--cast)" }}
              >
                {initials}
              </div>
            )}
          </button>

          {open && (
            <div
              className="absolute right-0 top-9 z-50 min-w-[160px] rounded-[10px] border py-1 shadow-xl"
              style={{ background: "#1a1613", borderColor: "var(--bronze)" }}
            >
              <div
                className="px-4 py-2 text-[11px] truncate"
                style={{ color: "var(--cast-dimmer)", fontFamily: "var(--font-mono)" }}
              >
                {session?.user?.email ?? name}
              </div>
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "2px 0" }} />
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm transition-colors hover:bg-white/5"
                style={{ color: "var(--cast-dim)" }}
              >
                Profile
              </Link>
              <button
                type="button"
                onClick={() => { setOpen(false); signOut({ callbackUrl: "/" }); }}
                className="block w-full text-left px-4 py-2 text-sm transition-colors hover:bg-white/5"
                style={{ color: "var(--cast-dim)" }}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
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
