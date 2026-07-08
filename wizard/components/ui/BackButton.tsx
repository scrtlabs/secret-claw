"use client";

import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="flex items-center gap-1 text-sm transition-colors text-[var(--cast-dim)] hover:text-[var(--cast)]"
    >
      ← Back
    </button>
  );
}
