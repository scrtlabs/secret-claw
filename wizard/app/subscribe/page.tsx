"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useSession } from "next-auth/react";
import FoundryNav from "@/components/homepage/foundry/FoundryNav";
import FoundryFooter from "@/components/homepage/foundry/FoundryFooter";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bluesnap?: any;
  }
}

const FEATURES = [
  "Deploy unlimited secret agents",
  "All runtimes — OpenClaw & Hermes",
  "SecretAI hosted inference (no key required)",
  "Telegram integration",
  "Confidential compute on SecretVM",
  "7-day free trial, cancel anytime",
];

type Stage = "loading" | "ready" | "submitting" | "success" | "error";

export default function SubscribePage() {
  const { status: sessionStatus } = useSession();
  const router = useRouter();

  const [stage, setStage] = useState<Stage>("loading");
  const [pfToken, setPfToken] = useState<string | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [sdkSrc, setSdkSrc] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const hpfInitialized = useRef(false);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (sessionStatus === "unauthenticated") router.replace("/sign-in");
  }, [sessionStatus, router]);

  // Fetch pfToken + planId + sdkUrl
  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    fetch("/api/subscription/checkout", { method: "POST" })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "Failed to init checkout");
        setPfToken(d.pfToken as string);
        setPlanId(d.planId as string);
        setSdkSrc(d.sdkUrl as string);
      })
      .catch(() => setStage("error"));
  }, [sessionStatus]);

  // Initialize HPF when both token and SDK are ready
  useEffect(() => {
    if (!pfToken || !sdkReady || hpfInitialized.current || !window.bluesnap) return;
    hpfInitialized.current = true;

    window.bluesnap.hostedPaymentFieldsCreate({
      token: pfToken,
      onFieldEventHandler: {
        onError: (tagId: string, errorCode: string, errorDescription: string) => {
          setFieldErrors((prev) => ({ ...prev, [tagId]: errorDescription || errorCode }));
        },
        onValid: (tagId: string) => {
          setFieldErrors((prev) => {
            const next = { ...prev };
            delete next[tagId];
            return next;
          });
        },
        onFocus: () => {},
        onBlur:  () => {},
      },
      style: {
        ".invalid": { color: "#ef4444" },
        input: {
          color: "#e8d5b7",
          "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
          "font-size": "14px",
        },
        "::placeholder": { color: "#7a6050" },
      },
      ccnPlaceHolder:     "Card number",
      cvvPlaceHolder:     "CVV",
      expDatePlaceHolder: "MM / YY",
    });

    setStage("ready");
  }, [pfToken, sdkReady]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!window.bluesnap || stage !== "ready") return;
    setSubmitError(null);
    setStage("submitting");

    window.bluesnap.hostedPaymentFieldsSubmitData(
      async (callback: { error?: Array<{ errorCode: string; errorDescription: string }>; cardData?: { pfToken: string } }) => {
        if (callback.error?.length) {
          setSubmitError(callback.error[0]?.errorDescription ?? "Card validation failed.");
          setStage("ready");
          return;
        }

        const signedToken = callback.cardData?.pfToken;
        if (!signedToken) {
          setSubmitError("Card data missing — please try again.");
          setStage("ready");
          return;
        }

        try {
          const res = await fetch("/api/subscription/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pfToken: signedToken, firstName, lastName }),
          });
          const body = await res.json();
          if (!res.ok) {
            setSubmitError((body as { error?: string }).error ?? "Subscription failed — please try again.");
            setStage("ready");
            return;
          }
          setStage("success");
          setTimeout(() => router.push("/agents?subscribed=true"), 1500);
        } catch {
          setSubmitError("Network error — please try again.");
          setStage("ready");
        }
      },
    );
  }

  const inputStyle: React.CSSProperties = {
    background: "#0e0b09",
    border: "1px solid var(--bronze)",
    borderRadius: "8px",
    color: "var(--cast)",
    fontSize: "14px",
    padding: "10px 14px",
    width: "100%",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  };

  const hpfFieldStyle: React.CSSProperties = {
    ...inputStyle,
    height: "42px",
  };

  return (
    <div className="fg-page">
      {sdkSrc && (
        <Script src={sdkSrc} strategy="afterInteractive" onReady={() => setSdkReady(true)} />
      )}
      <FoundryNav />

      <main className="mx-auto w-full max-w-xl px-6 py-12">

        {stage === "success" ? (
          <div className="text-center py-16">
            <div className="mb-4 text-4xl">✓</div>
            <h2 className="text-xl font-black mb-2" style={{ color: "var(--cast)" }}>You&apos;re in.</h2>
            <p className="text-sm" style={{ color: "var(--cast-dim)" }}>
              Redirecting to your dashboard…
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">

            {/* Plan card */}
            <div
              className="rounded-[14px] border p-6"
              style={{ background: "linear-gradient(180deg, #1a1613, #141110)", borderColor: "var(--bronze)" }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p
                    className="text-[10px] uppercase tracking-widest mb-1"
                    style={{ color: "var(--cast-dimmer)", fontFamily: "var(--font-mono)" }}
                  >
                    SecretForge
                  </p>
                  <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--cast)" }}>
                    Pro
                  </h1>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black" style={{ color: "var(--ember2)" }}>$29</span>
                  <span className="text-sm" style={{ color: "var(--cast-dimmer)" }}> / month</span>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--verify)" }}>
                    7-day free trial
                  </p>
                </div>
              </div>

              <ul className="flex flex-col gap-2">
                {FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--cast-dim)" }}>
                    <span
                      className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-sm"
                      style={{ background: "var(--molten)" }}
                    />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Card form */}
            <div
              className="rounded-[14px] border p-6 flex flex-col gap-4"
              style={{ background: "linear-gradient(180deg, #1a1613, #141110)", borderColor: "var(--bronze)" }}
            >
              <p
                className="text-[10px] uppercase tracking-widest"
                style={{ color: "var(--cast-dimmer)", fontFamily: "var(--font-mono)" }}
              >
                Payment details
              </p>

              {/* Cardholder name */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cast-dimmer)", fontFamily: "var(--font-mono)" }}>
                    First name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    required
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "var(--ember2)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--bronze)"; }}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cast-dimmer)", fontFamily: "var(--font-mono)" }}>
                    Last name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    required
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "var(--ember2)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--bronze)"; }}
                  />
                </div>
              </div>

              {/* BlueSnap HPF fields */}
              {stage === "loading" || !sdkReady ? (
                <div className="flex flex-col gap-3">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-[42px] w-full animate-pulse rounded-lg"
                      style={{ background: "#1a1613", border: "1px solid var(--bronze)", opacity: 0.5 }}
                    />
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cast-dimmer)", fontFamily: "var(--font-mono)" }}>
                      Card number
                    </label>
                    <div data-bluesnap="ccn" style={hpfFieldStyle} />
                    {fieldErrors["ccn"] && (
                      <p className="text-xs" style={{ color: "#ef4444" }}>{fieldErrors["ccn"]}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cast-dimmer)", fontFamily: "var(--font-mono)" }}>
                        Expiry
                      </label>
                      <div data-bluesnap="exp" style={hpfFieldStyle} />
                      {fieldErrors["exp"] && (
                        <p className="text-xs" style={{ color: "#ef4444" }}>{fieldErrors["exp"]}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cast-dimmer)", fontFamily: "var(--font-mono)" }}>
                        CVV
                      </label>
                      <div data-bluesnap="cvv" style={hpfFieldStyle} />
                      {fieldErrors["cvv"] && (
                        <p className="text-xs" style={{ color: "#ef4444" }}>{fieldErrors["cvv"]}</p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {submitError && (
                <p className="text-xs px-1" style={{ color: "#ef4444" }}>{submitError}</p>
              )}

              {stage === "error" && (
                <p className="text-xs" style={{ color: "#ef4444" }}>
                  Payment service unavailable. Check that BLUESNAP_API_USERNAME and BLUESNAP_API_PASSWORD are set.
                </p>
              )}

              <button
                type="submit"
                disabled={stage !== "ready"}
                className={`fgbtn w-full ${stage !== "ready" ? "fgbtn--idle" : ""}`}
                style={{ marginTop: "4px" }}
              >
                {stage === "submitting" ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Starting trial…
                  </span>
                ) : (
                  "Start 7-day free trial →"
                )}
              </button>

              <p className="text-center text-[11px]" style={{ color: "var(--cast-dimmer)" }}>
                No charge today · $29/month after trial · Cancel anytime
              </p>
            </div>
          </form>
        )}
      </main>
      <FoundryFooter />
    </div>
  );
}
