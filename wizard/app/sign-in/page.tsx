import { Suspense } from "react";
import { SignInForm } from "@/components/SignIn/SignInForm";
import { BackButton } from "@/components/ui/BackButton";

export const metadata = { title: "SecretForge — Sign in" };

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-portal-bg px-4">
      <div className="w-full max-w-sm rounded-2xl border border-portal-border bg-portal-surface p-8 shadow-xl">
        <div className="mb-6">
          <BackButton />
        </div>
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-portal-text">Sign in</h1>
          <p className="mt-1 text-sm text-portal-text/50">to SecretForge</p>
        </div>

        <Suspense>
          <SignInForm />
        </Suspense>

        <p className="mt-6 text-center text-sm text-portal-text/50">
          Don&apos;t have an account?{" "}
          <a href="/sign-up" className="font-medium text-portal-text hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
