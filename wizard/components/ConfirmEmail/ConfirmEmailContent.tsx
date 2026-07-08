"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type State = "loading" | "success" | "error" | "pending";

export function ConfirmEmailContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const email = params.get("email");

  const [state, setState] = useState<State>(token ? "loading" : "pending");
  const [errorMsg, setErrorMsg] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  useEffect(() => {
    if (!token) return;

    fetch("/api/auth/confirm-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setState("success");
        } else {
          setErrorMsg(data.error ?? "Confirmation failed.");
          setState("error");
        }
      })
      .catch(() => {
        setErrorMsg("Network error. Please try again.");
        setState("error");
      });
  }, [token]);

  const handleResend = async () => {
    if (!email) return;
    setResendLoading(true);
    try {
      await fetch("/api/auth/resend-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setResendSent(true);
    } finally {
      setResendLoading(false);
    }
  };

  if (state === "loading") {
    return (
      <div className="text-center">
        <div className="mb-4 text-3xl">⏳</div>
        <h1 className="text-xl font-bold" style={{ color: "var(--cast)" }}>Confirming your email…</h1>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="text-center">
        <div className="mb-4 text-3xl">✅</div>
        <h1 className="mb-2 text-xl font-bold" style={{ color: "var(--cast)" }}>Email confirmed!</h1>
        <p className="mb-6 text-sm text-[var(--cast-dim)]">Your account is ready.</p>
        <a
          href="/sign-in"
          className="fgbtn inline-block px-6 py-2.5 text-sm"
        >
          Sign in
        </a>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="text-center">
        <div className="mb-4 text-3xl">❌</div>
        <h1 className="mb-2 text-xl font-bold" style={{ color: "var(--cast)" }}>Confirmation failed</h1>
        <p className="mb-6 text-sm text-[var(--cast-dim)]">{errorMsg}</p>
        {email && (
          <button
            type="button"
            onClick={handleResend}
            disabled={resendLoading || resendSent}
            className="rounded-md border border-[var(--bronze)] px-5 py-2 text-sm font-medium transition-colors hover:bg-[var(--bronze)]/10 disabled:opacity-50"
            style={{ background: "var(--iron)", color: "var(--cast)" }}
          >
            {resendSent ? "Email sent!" : resendLoading ? "Sending…" : "Resend confirmation email"}
          </button>
        )}
      </div>
    );
  }

  // pending — no token in URL, just redirected from sign-up
  return (
    <div className="text-center">
      <div className="mb-4 text-3xl">📬</div>
      <h1 className="mb-2 text-xl font-bold" style={{ color: "var(--cast)" }}>Check your email</h1>
      <p className="mb-1 text-sm text-[var(--cast-dim)]">
        We sent a confirmation link to
      </p>
      {email && (
        <p className="mb-6 text-sm font-medium" style={{ color: "var(--cast)" }}>{decodeURIComponent(email)}</p>
      )}
      <p className="mb-6 text-xs text-[var(--cast-dimmer)]">
        Click the link in the email to activate your account. It expires in 24 hours.
      </p>
      {email && !resendSent && (
        <button
          type="button"
          onClick={handleResend}
          disabled={resendLoading}
          className="text-sm text-[var(--ember2)] underline-offset-2 hover:underline disabled:opacity-50"
        >
          {resendLoading ? "Sending…" : "Resend email"}
        </button>
      )}
      {resendSent && (
        <p className="text-sm text-[var(--cast-dim)]">Email resent!</p>
      )}
    </div>
  );
}
