"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import FoundryNav from "@/components/homepage/foundry/FoundryNav";
import FoundryFooter from "@/components/homepage/foundry/FoundryFooter";

interface SubData {
  status: "trialing" | "active" | "canceled" | "past_due" | "pending" | "none";
  active: boolean;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function daysLeft(iso: string | null): number {
  if (!iso) return 0;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function StatusBadge({ status }: { status: SubData["status"] }) {
  const map: Record<SubData["status"], { label: string; color: string; bg: string }> = {
    trialing:  { label: "Trial",    color: "var(--verify)",  bg: "rgba(56,161,105,0.12)" },
    active:    { label: "Active",   color: "var(--verify)",  bg: "rgba(56,161,105,0.12)" },
    past_due:  { label: "Past due", color: "var(--ember2)",  bg: "rgba(255,122,24,0.12)" },
    pending:   { label: "Pending",  color: "var(--cast-dim)", bg: "rgba(255,255,255,0.06)" },
    canceled:  { label: "Canceled", color: "#ef4444",         bg: "rgba(239,68,68,0.1)" },
    none:      { label: "None",     color: "var(--cast-dimmer)", bg: "rgba(255,255,255,0.04)" },
  };
  const { label, color, bg } = map[status] ?? map.none;
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide"
      style={{ color, background: bg }}
    >
      {label}
    </span>
  );
}

type CancelState = "idle" | "confirm" | "canceling" | "done";

export default function ProfilePage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [sub, setSub] = useState<SubData | null>(null);
  const [subLoading, setSubLoading] = useState(true);
  const [cancelState, setCancelState] = useState<CancelState>("idle");
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") router.replace("/sign-in");
  }, [sessionStatus, router]);

  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    fetch("/api/subscription")
      .then((r) => r.json())
      .then((d) => setSub(d as SubData))
      .catch(() => setSub(null))
      .finally(() => setSubLoading(false));
  }, [sessionStatus]);

  async function handleCancel() {
    setCancelState("canceling");
    setCancelError(null);
    try {
      const res = await fetch("/api/subscription", { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) {
        setCancelError((body as { error?: string }).error ?? "Cancellation failed.");
        setCancelState("confirm");
        return;
      }
      setSub((prev) => prev ? { ...prev, cancelAtPeriodEnd: true } : prev);
      setCancelState("done");
    } catch {
      setCancelError("Network error — please try again.");
      setCancelState("confirm");
    }
  }

  const user = session?.user;
  const name = user?.name ?? user?.email ?? "User";
  const initials = name.charAt(0).toUpperCase();

  const canCancel =
    sub &&
    (sub.status === "trialing" || sub.status === "active") &&
    !sub.cancelAtPeriodEnd &&
    cancelState !== "done";

  return (
    <div className="fg-page">
      <FoundryNav />
      <main className="mx-auto w-full max-w-xl px-6 py-12 flex flex-col gap-6">

        {/* User card */}
        <div
          className="rounded-[14px] border p-6 flex items-center gap-4"
          style={{ background: "linear-gradient(180deg, #1a1613, #141110)", borderColor: "var(--bronze)" }}
        >
          {user?.image ? (
            <Image
              src={user.image}
              alt={name}
              width={52}
              height={52}
              className="rounded-full border-2 border-[var(--bronze)]"
            />
          ) : (
            <div
              className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-full border-2 border-[var(--bronze)] text-xl font-black"
              style={{ background: "var(--forge)", color: "var(--cast)" }}
            >
              {initials}
            </div>
          )}
          <div className="flex flex-col gap-0.5 min-w-0">
            <p className="text-base font-bold truncate" style={{ color: "var(--cast)" }}>{name}</p>
            {user?.email && user.email !== name && (
              <p className="text-sm truncate" style={{ color: "var(--cast-dimmer)", fontFamily: "var(--font-mono)" }}>
                {user.email}
              </p>
            )}
          </div>
        </div>

        {/* Subscription card */}
        <div
          className="rounded-[14px] border p-6 flex flex-col gap-5"
          style={{ background: "linear-gradient(180deg, #1a1613, #141110)", borderColor: "var(--bronze)" }}
        >
          <p
            className="text-[10px] uppercase tracking-widest"
            style={{ color: "var(--cast-dimmer)", fontFamily: "var(--font-mono)" }}
          >
            Subscription
          </p>

          {subLoading ? (
            <div className="flex flex-col gap-3">
              {[80, 120, 100].map((w, i) => (
                <div key={i} className="h-4 animate-pulse rounded" style={{ width: `${w}px`, background: "#2a1f17" }} />
              ))}
            </div>
          ) : !sub || sub.status === "none" ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm" style={{ color: "var(--cast-dim)" }}>No active subscription.</p>
              <a href="/subscribe" className="fgbtn inline-block self-start">
                Start free trial →
              </a>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Status row */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold" style={{ color: "var(--cast)" }}>SecretForge Pro</span>
                <StatusBadge status={sub.status} />
              </div>

              {/* Details */}
              <div className="flex flex-col gap-2">
                {sub.trialEndsAt && daysLeft(sub.trialEndsAt) > 0 && sub.status !== "canceled" && (() => {
                  const left = daysLeft(sub.trialEndsAt);
                  const pct = Math.min(100, Math.round(((7 - left) / 7) * 100));
                  return (
                    <div className="flex flex-col gap-2 rounded-[10px] border p-3" style={{ background: "rgba(56,161,105,0.05)", borderColor: "rgba(56,161,105,0.2)" }}>
                      <div className="flex items-center justify-between text-sm">
                        <span style={{ color: "var(--cast-dim)" }}>Trial period</span>
                        <span className="font-semibold" style={{ color: "var(--verify)" }}>
                          {left === 0 ? "Ends today" : `${left} day${left === 1 ? "" : "s"} left`}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: left <= 1 ? "#ef4444" : left <= 2 ? "var(--ember2)" : "var(--verify)" }}
                        />
                      </div>
                      <p className="text-xs" style={{ color: "var(--cast-dimmer)" }}>
                        Ends {fmt(sub.trialEndsAt)}
                        {!sub.cancelAtPeriodEnd && sub.status !== "canceled" && " · $29/month after trial"}
                      </p>
                    </div>
                  );
                })()}
                {sub.currentPeriodEnd && sub.status !== "canceled" && !(sub.trialEndsAt && daysLeft(sub.trialEndsAt) > 0) && (
                  <Row
                    label={sub.cancelAtPeriodEnd ? "Access until" : "Next renewal"}
                    value={fmt(sub.currentPeriodEnd)}
                  />
                )}
                {sub.status === "canceled" && (
                  <p className="text-sm" style={{ color: "#ef4444" }}>
                    Subscription canceled.
                    {sub.currentPeriodEnd && ` Access until ${fmt(sub.currentPeriodEnd)}.`}
                  </p>
                )}
                {sub.cancelAtPeriodEnd && sub.status !== "canceled" && (
                  <p className="text-xs px-1" style={{ color: "var(--ember2)" }}>
                    Cancels at end of current period — no further charges.
                  </p>
                )}
              </div>

              {/* Cancel section */}
              {canCancel && cancelState === "idle" && (
                <button
                  type="button"
                  onClick={() => setCancelState("confirm")}
                  className="self-start text-xs underline underline-offset-2 transition-opacity hover:opacity-70"
                  style={{ color: "var(--cast-dimmer)" }}
                >
                  Cancel subscription
                </button>
              )}

              {cancelState === "confirm" && (
                <div
                  className="rounded-[10px] border p-4 flex flex-col gap-3"
                  style={{ background: "rgba(239,68,68,0.05)", borderColor: "rgba(239,68,68,0.25)" }}
                >
                  <p className="text-sm font-semibold" style={{ color: "var(--cast)" }}>
                    Cancel subscription?
                  </p>
                  <p className="text-xs" style={{ color: "var(--cast-dim)" }}>
                    You&apos;ll keep Pro access until the end of the current billing period. No refund is issued.
                  </p>
                  {cancelError && (
                    <p className="text-xs" style={{ color: "#ef4444" }}>{cancelError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="fgbtn text-xs px-4 py-2"
                      style={{ background: "#7f1d1d", borderColor: "#ef4444" }}
                    >
                      Confirm cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => { setCancelState("idle"); setCancelError(null); }}
                      className="fgbtn fgbtn--idle text-xs px-4 py-2"
                    >
                      Keep subscription
                    </button>
                  </div>
                </div>
              )}

              {cancelState === "canceling" && (
                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--cast-dim)" }}>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Canceling…
                </div>
              )}

              {cancelState === "done" && (
                <p className="text-xs" style={{ color: "var(--verify)" }}>
                  Subscription canceled. You&apos;ll retain access until the end of the billing period.
                </p>
              )}
            </div>
          )}
        </div>

      </main>
      <FoundryFooter />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span style={{ color: "var(--cast-dimmer)" }}>{label}</span>
      <span style={{ color: "var(--cast)" }}>{value}</span>
    </div>
  );
}
