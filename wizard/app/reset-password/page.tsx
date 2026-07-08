import { Suspense } from "react";
import { BackButton } from "@/components/ui/BackButton";
import { ResetPasswordForm } from "@/components/ResetPassword/ResetPasswordForm";

export const metadata = { title: "SecretForge — Reset password" };

export default function ResetPasswordPage() {
  return (
    <div className="fg-page flex min-h-screen items-center justify-center px-4">
      <div
        className="w-full max-w-sm rounded-2xl border border-[var(--bronze)] p-8 shadow-xl"
        style={{ background: "linear-gradient(180deg, #1a1613, #141110)" }}
      >
        <div className="mb-6">
          <BackButton />
        </div>
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold" style={{ color: "var(--cast)" }}>Reset password</h1>
          <p className="mt-1 text-sm text-[var(--cast-dim)]">Enter your new password below</p>
        </div>

        <Suspense>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
