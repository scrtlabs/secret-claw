import { Suspense } from "react";
import { ConfirmEmailContent } from "@/components/ConfirmEmail/ConfirmEmailContent";

export const metadata = { title: "SecretForge — Confirm email" };

export default function ConfirmEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-portal-bg px-4">
      <div className="w-full max-w-sm rounded-2xl border border-portal-border bg-portal-surface p-8 shadow-xl">
        <Suspense
          fallback={
            <div className="text-center text-sm text-portal-text/50">Loading…</div>
          }
        >
          <ConfirmEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
