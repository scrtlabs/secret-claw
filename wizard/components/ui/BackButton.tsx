"use client";

import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="flex items-center gap-1 text-sm text-portal-text/50 transition-colors hover:text-portal-text"
    >
      ← Back
    </button>
  );
}
