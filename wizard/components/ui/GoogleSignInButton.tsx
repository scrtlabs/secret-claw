"use client";

import { useCallback } from "react";
import { signIn } from "next-auth/react";

// sessionStorage key the deploy wizard reads on mount to pre-populate the
// SecretAI key field. Keep this string in sync with create-agent/page.tsx.
export const SECRETAI_KEY_STORAGE_KEY = "secretforge:secretai-key";

interface SignInOptions {
  redirectTo?: string; // where to land after auth; defaults to the wizard
  onSuccess?: (apiKey: string) => void;
  onError?: (err: Error) => void;
}

// Shared sign-in behaviour, used by both the GoogleSignInButton and the
// homepage "What you can deploy" cards (which route through sign-in carrying
// a pre-selected runtime/tier in the redirect URL).
export function useGoogleSignIn() {
  return useCallback(
    (opts: SignInOptions = {}) => {
      const { redirectTo = "/create-agent", onError } = opts;
      signIn("google", { callbackUrl: redirectTo }).catch((err) => {
        if (onError) onError(err instanceof Error ? err : new Error(String(err)));
      });
    },
    [],
  );
}

interface GoogleSignInButtonProps {
  onSuccess?: (apiKey: string) => void; // Secret Labs calls this post-auth
  onError?: (err: Error) => void;
  className?: string;
  size?: "sm" | "lg";
  label?: string;
  redirectTo?: string; // override post-auth destination (e.g. pre-selected wizard)
  disabled?: boolean; // gate the CTA until a selection is complete
}

function GoogleGlyph({ className }: { className?: string }) {
  // Official Google "G" mark — inline SVG, no external dependency.
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export function GoogleSignInButton({
  onSuccess,
  onError,
  className,
  size = "lg",
  label = "Sign in with Google",
  redirectTo,
  disabled = false,
}: GoogleSignInButtonProps) {
  const signIn = useGoogleSignIn();

  const sizeClasses =
    size === "lg" ? "gap-3 px-5 py-3 text-sm" : "gap-2 px-3 py-1.5 text-xs";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => signIn({ redirectTo, onSuccess, onError })}
      className={`inline-flex items-center justify-center rounded-md border border-portal-border bg-white font-semibold text-[#1F1F1F] shadow-sm transition-colors hover:bg-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white ${sizeClasses} ${className || ""}`}
    >
      <GoogleGlyph className={size === "lg" ? "h-5 w-5" : "h-4 w-4"} />
      {label}
    </button>
  );
}

export default GoogleSignInButton;
