import { Suspense } from "react";
import { ConfirmEmailContent } from "@/components/ConfirmEmail/ConfirmEmailContent";

export const metadata = { title: "SecretForge — Confirm email" };

export default function ConfirmEmailPage() {
  return (
    <div className="fg-page flex min-h-screen items-center justify-center px-4">
      <div
        className="w-full max-w-sm rounded-2xl border border-[var(--bronze)] p-8 shadow-xl"
        style={{ background: "linear-gradient(180deg, #1a1613, #141110)" }}
      >
        <Suspense
          fallback={
            <div className="text-center text-sm text-[var(--cast-dim)]">Loading…</div>
          }
        >
          <ConfirmEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
