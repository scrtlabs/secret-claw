"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FieldErrors = Partial<Record<"email" | "password" | "confirmPassword", string[]>>;

const forgeInput =
  "w-full rounded-md border border-[var(--bronze)] px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-1 focus:border-[var(--molten)] focus:ring-[var(--molten)]/30 placeholder:text-[var(--cast-dimmer)] disabled:opacity-50";

export function SignUpForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setServerError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, confirmPassword }),
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

      router.push(`/confirm-email?email=${encodeURIComponent(email)}`);
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Email */}
      <div className="flex flex-col gap-1">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          className={forgeInput}
          style={{ background: "var(--iron)", color: "var(--cast)" }}
        />
        {fieldErrors.email && (
          <p className="text-xs text-red-400">{fieldErrors.email[0]}</p>
        )}
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1">
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className={forgeInput}
            style={{ background: "var(--iron)", color: "var(--cast)" }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--cast-dim)] hover:text-[var(--cast)]"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        {fieldErrors.password && (
          <p className="text-xs text-red-400">{fieldErrors.password[0]}</p>
        )}
      </div>

      {/* Confirm password */}
      <div className="flex flex-col gap-1">
        <div className="relative">
          <input
            type={showConfirm ? "text" : "password"}
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
            className={forgeInput}
            style={{ background: "var(--iron)", color: "var(--cast)" }}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--cast-dim)] hover:text-[var(--cast)]"
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
        className="fgbtn w-full disabled:opacity-50"
      >
        {loading ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
