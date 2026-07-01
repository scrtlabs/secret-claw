"use client";

import { useState } from "react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const [serverError, setServerError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError("");
    setServerError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors?.email) {
          setFieldError(data.errors.email[0]);
        } else {
          setServerError(data.error ?? "Something went wrong. Please try again.");
        }
        return;
      }

      setSent(true);
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center">
        <div className="mb-4 text-3xl">📬</div>
        <p className="mb-1 text-sm text-portal-text/50">If an account exists for</p>
        <p className="mb-4 text-sm font-medium text-portal-text">{email}</p>
        <p className="text-sm text-portal-text/50">
          you&apos;ll receive a password reset link shortly. Check your spam folder if it
          doesn&apos;t arrive.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          className="w-full rounded-md border border-portal-border bg-portal-surface px-4 py-2.5 text-sm text-portal-text placeholder-portal-text/40 focus:outline-none focus:ring-1 focus:ring-portal-border disabled:opacity-50"
        />
        {fieldError && <p className="text-xs text-red-400">{fieldError}</p>}
      </div>

      {serverError && <p className="text-xs text-red-400">{serverError}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-portal-text py-2.5 text-sm font-semibold text-portal-bg transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
