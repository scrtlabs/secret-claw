import { Suspense } from "react";
import { BackButton } from "@/components/ui/BackButton";
import { ResetPasswordForm } from "@/components/ResetPassword/ResetPasswordForm";

export const metadata = { title: "SecretForge — Reset password" };

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-portal-bg px-4">
      <div className="w-full max-w-sm rounded-2xl border border-portal-border bg-portal-surface p-8 shadow-xl">
        <div className="mb-6">
          <BackButton />
        </div>
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-portal-text">Reset password</h1>
          <p className="mt-1 text-sm text-portal-text/50">Enter your new password below</p>
        </div>

        <Suspense>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
