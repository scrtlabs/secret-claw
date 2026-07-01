"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<"password" | "confirmPassword", string[]>>>({});
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-sm text-red-400">Invalid reset link. Please request a new one.</p>
        <a
          href="/forgot-password"
          className="mt-4 inline-block text-sm text-portal-text/50 hover:text-portal-text hover:underline"
        >
          Request new link
        </a>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="mb-4 text-3xl">✅</div>
        <h2 className="mb-2 text-lg font-semibold text-portal-text">Password updated!</h2>
        <p className="mb-6 text-sm text-portal-text/50">You can now sign in with your new password.</p>
        <a
          href="/sign-in"
          className="inline-block rounded-md bg-portal-text px-6 py-2.5 text-sm font-semibold text-portal-bg transition-opacity hover:opacity-90"
        >
          Sign in
        </a>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setServerError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          setFieldErrors(data.errors);
        } else {
          setServerError(data.error ?? "Something went wrong. Please try again.");
        }
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/sign-in"), 3000);
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* New password */}
      <div className="flex flex-col gap-1">
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="w-full rounded-md border border-portal-border bg-portal-surface px-4 py-2.5 text-sm text-portal-text placeholder-portal-text/40 focus:outline-none focus:ring-1 focus:ring-portal-border disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-portal-text/50 hover:text-portal-text"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        {fieldErrors.password && (
          <p className="text-xs text-red-400">{fieldErrors.password[0]}</p>
        )}
        <p className="text-xs text-portal-text/40">
          Min 8 characters, uppercase, lowercase, number, special character.
        </p>
      </div>

      {/* Confirm password */}
      <div className="flex flex-col gap-1">
        <div className="relative">
          <input
            type={showConfirm ? "text" : "password"}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
            className="w-full rounded-md border border-portal-border bg-portal-surface px-4 py-2.5 text-sm text-portal-text placeholder-portal-text/40 focus:outline-none focus:ring-1 focus:ring-portal-border disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-portal-text/50 hover:text-portal-text"
          >
            {showConfirm ? "Hide" : "Show"}
          </button>
        </div>
        {fieldErrors.confirmPassword && (
          <p className="text-xs text-red-400">{fieldErrors.confirmPassword[0]}</p>
        )}
      </div>

      {serverError && <p className="text-xs text-red-400">{serverError}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-portal-text py-2.5 text-sm font-semibold text-portal-bg transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
