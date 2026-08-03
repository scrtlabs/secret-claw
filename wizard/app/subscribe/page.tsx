"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useSession } from "next-auth/react";
import FoundryNav from "@/components/homepage/foundry/FoundryNav";
import FoundryFooter from "@/components/homepage/foundry/FoundryFooter";

// Defined outside the component so the object reference never changes between
// renders — prevents React from re-applying style props to the BlueSnap iframe
// containers (which would detach the iframes and disable the card fields).
const INPUT_STYLE: React.CSSProperties = {
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

const HPF_FIELD_STYLE: React.CSSProperties = {
  ...INPUT_STYLE,
  height: "42px",
};

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

// Mirror of the draft the create-agent page stashes before sending an
// unsubscribed user here. Kept in sync with AgentDraft in create-agent/page.tsx.
const AGENT_DRAFT_STORAGE_KEY = "secretforge:agent-draft";
interface AgentDraft {
  runtime: "openclaw" | "hermes";
  tier: "byo" | "secret";
  secretaiModel: string;
  secretaiKey: string;
  anthropicKey: string;
  selectedKeyId: string | null;
  telegramChoice: "enabled" | "skipped" | null;
  botToken: string;
  chatId: string;
  botUsername?: string;
}

function readAgentDraft(): AgentDraft | null {
  try {
    const raw = sessionStorage.getItem(AGENT_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AgentDraft;
  } catch {
    return null;
  }
}

export default function SubscribePage() {
  const { status: sessionStatus } = useSession();
  const router = useRouter();

  const [stage, setStage] = useState<Stage>("loading");
  const [pfToken, setPfToken] = useState<string | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [sdkSrc, setSdkSrc] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const hpfInitialized = useRef(false);

  const nextRef = useRef<string>("/agents?subscribed=true");
  // True when the user arrived mid-agent-creation (a draft is waiting). On
  // success we forge that agent and jump straight to its details page instead
  // of routing back through the create-agent form.
  const [hasDraft, setHasDraft] = useState(false);
  useEffect(() => {
    try {
      const raw = new URLSearchParams(window.location.search).get("next");
      // Only accept same-origin relative paths to avoid open-redirects.
      if (raw && raw.startsWith("/") && !raw.startsWith("//")) nextRef.current = raw;
    } catch {
      // Malformed query string; keep the default.
    }
    setHasDraft(readAgentDraft() !== null);
  }, []);

  // Forge the agent described by the stashed draft, returning its deployment id.
  // Throws if the deployment request fails so the caller can fall back to the
  // create-agent form (draft left intact) rather than dropping the user's work.
  const forgeDraftAgent = useCallback(async (): Promise<string | null> => {
    const d = readAgentDraft();
    if (!d) return null;
    // Empty secretai key => the user relied on a linked portal account; omit it
    // so the server resolves the stored key (matches the create-agent flow).
    const secretaiApiKey = (d.secretaiKey ?? "").trim() || undefined;
    const res = await fetch("/api/portal/submit-deployment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        runtime: d.runtime,
        tier: d.tier,
        secretaiApiKey,
        secretaiModel: d.tier === "secret" ? d.secretaiModel : undefined,
        anthropicApiKey: d.tier === "byo" && !d.selectedKeyId ? (d.anthropicKey ?? "").trim() : undefined,
        anthropicKeyId: d.tier === "byo" && d.selectedKeyId ? d.selectedKeyId : undefined,
        telegramEnabled: d.telegramChoice === "enabled",
        telegramBotToken: d.telegramChoice === "enabled" ? (d.botToken ?? "").trim() : undefined,
        telegramChatId: d.telegramChoice === "enabled" ? (d.chatId ?? "").trim() : undefined,
        telegramBotUsername: d.telegramChoice === "enabled" ? d.botUsername : undefined,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Forge failed (${res.status}). ${detail.slice(0, 200)}`);
    }
    const body = (await res.json()) as { deployment_id: string };
    try {
      if (secretaiApiKey) {
        sessionStorage.setItem(`secret-claw:apikey:${body.deployment_id}`, secretaiApiKey);
      }
      sessionStorage.removeItem(AGENT_DRAFT_STORAGE_KEY);
    } catch {
      // sessionStorage may be blocked; the agent still exists server-side.
    }
    return body.deployment_id;
  }, []);

  // Called once the subscription is confirmed. Prefers forging the pending draft
  // and opening its details page; on any failure returns to the create-agent
  // form (draft preserved) so nothing is lost; with no draft, honors `next`.
  const finishAfterSubscribe = useCallback(async () => {
    try {
      const id = await forgeDraftAgent();
      if (id) {
        router.push(`/agents/${id}`);
        return;
      }
    } catch {
      router.push("/create-agent");
      return;
    }
    router.push(nextRef.current);
  }, [forgeDraftAgent, router]);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (sessionStatus === "unauthenticated") router.replace("/sign-in");
  }, [sessionStatus, router]);

  const mintToken = useCallback(async () => {
    hpfInitialized.current = false;
    setPfToken(null);
    const r = await fetch("/api/subscription/checkout", { method: "POST" });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error ?? "Failed to init checkout");
    setPlanId(d.planId as string);
    setSdkSrc(d.sdkUrl as string);
    setPfToken(d.pfToken as string);
  }, []);

  // Fetch pfToken on mount
  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    mintToken().catch(() => setStage("error"));
  }, [sessionStatus, mintToken]);

  const resetForRetry = useCallback((message: string) => {
    setSubmitError(message);
    setStage("loading");
    mintToken().catch(() => setStage("error"));
  }, [mintToken]);

  // Initialize HPF when both token and SDK are ready.
  // Wait one paint cycle (setTimeout 0) after divs appear — matches devportal pattern.
  useEffect(() => {
    if (!pfToken || !sdkReady || hpfInitialized.current) return;

    const init = () => {
      const bs = window.bluesnap;
      if (!bs) return;
      hpfInitialized.current = true;

      const bsObj = {
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
          input: {
            color: "#e8d5b7",
            "font-size": "16px",
            "font-family": "Inter, ui-sans-serif, system-ui, sans-serif",
            "background-color": "transparent",
          },
        },
        ccnPlaceHolder:  "1234 5678 9012 3456",
        cvvPlaceHolder:  "123",
        expPlaceHolder:  "MM/YY",
      };

      // SDK v5 renamed the method; try both
      if (typeof bs.hostedPaymentFields === "function") {
        bs.hostedPaymentFields(bsObj);
      } else {
        bs.hostedPaymentFieldsCreate(bsObj);
      }

      setStage("ready");
    };

    // One paint cycle so the data-bluesnap divs are fully in the DOM
    setTimeout(init, 0);
  }, [pfToken, sdkReady]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!window.bluesnap || stage !== "ready" || !pfToken) return;
    setSubmitError(null);
    setStage("submitting");

    // SDK v5: two separate callbacks (success, error).
    // After HPF submit succeeds, the original pfToken is now signed with the
    // entered card data — pass it directly to the server (no token from callback).
    window.bluesnap.hostedPaymentFieldsSubmitData(
      async () => {
        try {
          const res = await fetch("/api/subscription/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pfToken,
              firstName: firstNameRef.current?.value ?? "",
              lastName: lastNameRef.current?.value ?? "",
            }),
          });
          const body = await res.json();
          if (res.status === 409) {
            setStage("success");
            setTimeout(() => void finishAfterSubscribe(), 1500);
            return;
          }
          if (!res.ok) {
            resetForRetry((body as { error?: string }).error ?? "Subscription failed — please try again.");
            return;
          }
          setStage("success");
          setTimeout(() => void finishAfterSubscribe(), 1500);
        } catch {
          resetForRetry("Network error — please try again.");
        }
      },
      (errors: Array<{ errorCode: string; errorDescription: string }>) => {
        setSubmitError(errors?.[0]?.errorDescription ?? "Card validation failed.");
        setStage("ready");
      },
    );
  }


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
              {hasDraft
                ? "Forging your agent…"
                : "Redirecting to your dashboard…"}
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
                    ref={firstNameRef}
                    type="text"
                    defaultValue=""
                    placeholder="John"
                    required
                    style={INPUT_STYLE}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "var(--ember2)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--bronze)"; }}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cast-dimmer)", fontFamily: "var(--font-mono)" }}>
                    Last name
                  </label>
                  <input
                    ref={lastNameRef}
                    type="text"
                    defaultValue=""
                    placeholder="Doe"
                    required
                    style={INPUT_STYLE}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "var(--ember2)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--bronze)"; }}
                  />
                </div>
              </div>

              {/* BlueSnap HPF fields — must be in DOM before init() is called */}
              {!pfToken || !sdkReady ? (
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
                    <div data-bluesnap="ccn" style={HPF_FIELD_STYLE} />
                    {fieldErrors["ccn"] && (
                      <p className="text-xs" style={{ color: "#ef4444" }}>{fieldErrors["ccn"]}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cast-dimmer)", fontFamily: "var(--font-mono)" }}>
                        Expiry
                      </label>
                      <div data-bluesnap="exp" style={HPF_FIELD_STYLE} />
                      {fieldErrors["exp"] && (
                        <p className="text-xs" style={{ color: "#ef4444" }}>{fieldErrors["exp"]}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cast-dimmer)", fontFamily: "var(--font-mono)" }}>
                        CVV
                      </label>
                      <div data-bluesnap="cvv" style={HPF_FIELD_STYLE} />
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
