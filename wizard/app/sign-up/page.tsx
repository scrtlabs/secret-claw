import { Suspense } from "react";
import { BackButton } from "@/components/ui/BackButton";
import { SignUpForm } from "@/components/SignUp/SignUpForm";

export const metadata = { title: "SecretForge — Sign up" };

export default function SignUpPage() {
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
          <h1 className="text-2xl font-bold" style={{ color: "var(--cast)" }}>Create account</h1>
          <p className="mt-1 text-sm text-[var(--cast-dim)]">to SecretForge</p>
        </div>

        <Suspense>
          <SignUpForm />
        </Suspense>

        <p className="mt-6 text-center text-sm text-[var(--cast-dim)]">
          Already have an account?{" "}
          <a href="/sign-in" className="font-medium text-[var(--ember2)] hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
