import { BackButton } from "@/components/ui/BackButton";
import { ForgotPasswordForm } from "@/components/ForgotPassword/ForgotPasswordForm";

export const metadata = { title: "SecretForge — Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-portal-bg px-4">
      <div className="w-full max-w-sm rounded-2xl border border-portal-border bg-portal-surface p-8 shadow-xl">
        <div className="mb-6">
          <BackButton />
        </div>
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-portal-text">Forgot password</h1>
          <p className="mt-1 text-sm text-portal-text/50">
            Enter your email and we&apos;ll send a reset link
          </p>
        </div>

        <ForgotPasswordForm />
      </div>
    </div>
  );
}
