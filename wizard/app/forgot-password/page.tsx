import { BackButton } from "@/components/ui/BackButton";
import { ForgotPasswordForm } from "@/components/ForgotPassword/ForgotPasswordForm";

export const metadata = { title: "SecretForge — Forgot password" };

export default function ForgotPasswordPage() {
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
          <h1 className="text-2xl font-bold" style={{ color: "var(--cast)" }}>Forgot password</h1>
          <p className="mt-1 text-sm text-[var(--cast-dim)]">
            Enter your email and we&apos;ll send a reset link
          </p>
        </div>

        <ForgotPasswordForm />
      </div>
    </div>
  );
}
