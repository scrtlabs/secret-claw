import { Suspense } from "react";
import { BackButton } from "@/components/ui/BackButton";
import { SignUpForm } from "@/components/SignUp/SignUpForm";

export const metadata = { title: "SecretForge — Sign up" };

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-portal-bg px-4">
      <div className="w-full max-w-sm rounded-2xl border border-portal-border bg-portal-surface p-8 shadow-xl">
        <div className="mb-6">
          <BackButton />
        </div>
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-portal-text">Create account</h1>
          <p className="mt-1 text-sm text-portal-text/50">to SecretForge</p>
        </div>

        <Suspense>
          <SignUpForm />
        </Suspense>

        <p className="mt-6 text-center text-sm text-portal-text/50">
          Already have an account?{" "}
          <a href="/sign-in" className="font-medium text-portal-text hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
