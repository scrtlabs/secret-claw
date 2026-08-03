"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import FoundryNav from "@/components/homepage/foundry/FoundryNav";
import FoundryFooter from "@/components/homepage/foundry/FoundryFooter";

interface Promocode {
  id: string;
  code: string;
  description: string | null;
  durationDays: number;
  maxRedemptions: number | null;
  redeemedCount: number;
  active: boolean;
  expiresAt: string | null;
  createdAt: string;
}

type Access = "checking" | "granted" | "denied";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const CARD_STYLE: React.CSSProperties = {
  background: "linear-gradient(180deg, #1a1613, #141110)",
  borderColor: "var(--bronze)",
};

const inputStyle: React.CSSProperties = { background: "var(--iron)", color: "var(--cast)" };
const inputCls =
  "block w-full rounded-md border border-[var(--bronze)] px-3 py-2 text-sm placeholder:text-[var(--cast-dimmer)] focus:border-[var(--molten)] focus:outline-none focus:ring-1 focus:ring-[var(--molten)]/30";

export default function AdminPage() {
  const { status: sessionStatus } = useSession();
  const router = useRouter();

  const [access, setAccess] = useState<Access>("checking");
  const [codes, setCodes] = useState<Promocode[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Create-form fields.
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [durationDays, setDurationDays] = useState("30");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") router.replace("/sign-in");
  }, [sessionStatus, router]);

  const loadCodes = useCallback(async () => {
    const res = await fetch("/api/admin/promocodes");
    if (!res.ok) throw new Error(`Failed to load (${res.status})`);
    const d = (await res.json()) as { promocodes: Promocode[] };
    setCodes(d.promocodes);
  }, []);

  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/access");
        const d = (await res.json()) as { admin?: boolean };
        if (cancelled) return;
        if (!d.admin) { setAccess("denied"); return; }
        setAccess("granted");
        await loadCodes();
      } catch {
        if (!cancelled) setLoadError("Could not load promo codes.");
      }
    })();
    return () => { cancelled = true; };
  }, [sessionStatus, loadCodes]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/admin/promocodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          description: description.trim() || undefined,
          durationDays: Number(durationDays),
          maxRedemptions: maxRedemptions.trim() === "" ? null : Number(maxRedemptions),
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { promocode?: Promocode; error?: string };
      if (!res.ok || !body.promocode) {
        setCreateError(body.error ?? `Could not create code (${res.status}).`);
        return;
      }
      setCodes((prev) => [body.promocode!, ...(prev ?? [])]);
      setCode(""); setDescription(""); setDurationDays("30"); setMaxRedemptions(""); setExpiresAt("");
    } catch {
      setCreateError("Network error — please try again.");
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(pc: Promocode) {
    // Optimistic flip; revert on failure.
    setCodes((prev) => prev?.map((c) => (c.id === pc.id ? { ...c, active: !c.active } : c)) ?? prev);
    const res = await fetch(`/api/admin/promocodes/${pc.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !pc.active }),
    }).catch(() => null);
    if (!res || !res.ok) {
      setCodes((prev) => prev?.map((c) => (c.id === pc.id ? { ...c, active: pc.active } : c)) ?? prev);
    }
  }

  async function remove(pc: Promocode) {
    if (!window.confirm(`Delete promo code "${pc.code}"? Existing redemptions keep their access.`)) return;
    const prev = codes;
    setCodes((cur) => cur?.filter((c) => c.id !== pc.id) ?? cur);
    const res = await fetch(`/api/admin/promocodes/${pc.id}`, { method: "DELETE" }).catch(() => null);
    if (!res || !res.ok) setCodes(prev ?? null); // restore on failure
  }

  if (access === "checking") {
    return (
      <div className="fg-page">
        <FoundryNav />
        <main className="mx-auto w-full max-w-3xl px-6 py-16 text-center">
          <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[var(--cast-dim)] border-t-transparent" />
        </main>
      </div>
    );
  }

  if (access === "denied") {
    return (
      <div className="fg-page">
        <FoundryNav />
        <main className="mx-auto w-full max-w-3xl px-6 py-16 text-center">
          <h1 className="text-xl font-black mb-2" style={{ color: "var(--cast)" }}>Forbidden</h1>
          <p className="text-sm" style={{ color: "var(--cast-dim)" }}>
            You don&apos;t have access to the admin dashboard.
          </p>
        </main>
        <FoundryFooter />
      </div>
    );
  }

  return (
    <div className="fg-page">
      <FoundryNav />
      <main className="mx-auto w-full max-w-3xl px-6 py-12 flex flex-col gap-6">
        <div>
          <span className="fh__eyebrow">Admin</span>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight" style={{ color: "var(--cast)", fontFamily: "var(--font-archivo)" }}>
            Promo codes
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--cast-dim)" }}>
            Issue configurable codes that grant free Pro access. Users redeem them from their profile.
          </p>
        </div>

        {/* Create form */}
        <form onSubmit={handleCreate} className="rounded-[14px] border p-6 flex flex-col gap-4" style={CARD_STYLE}>
          <p className="text-[10px] uppercase tracking-widest" style={{ color: "var(--cast-dimmer)", fontFamily: "var(--font-mono)" }}>
            New promo code
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Code">
              <input
                className={inputCls}
                style={{ ...inputStyle, textTransform: "uppercase" }}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="LAUNCH30"
                required
              />
            </Field>
            <Field label="Free days">
              <input
                className={inputCls} style={inputStyle} type="number" min={1} max={3650}
                value={durationDays} onChange={(e) => setDurationDays(e.target.value)} required
              />
            </Field>
            <Field label="Max redemptions (blank = unlimited)">
              <input
                className={inputCls} style={inputStyle} type="number" min={1}
                value={maxRedemptions} onChange={(e) => setMaxRedemptions(e.target.value)} placeholder="Unlimited"
              />
            </Field>
            <Field label="Expires (blank = never)">
              <input
                className={inputCls} style={inputStyle} type="date"
                value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Description (optional)">
                <input
                  className={inputCls} style={inputStyle}
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Launch week — 30 days free"
                />
              </Field>
            </div>
          </div>
          {createError && <p className="text-xs" style={{ color: "#ef4444" }}>{createError}</p>}
          <button type="submit" disabled={creating} className={`fgbtn self-start ${creating ? "fgbtn--idle" : ""}`}>
            {creating ? "Creating…" : "Create code"}
          </button>
        </form>

        {/* List */}
        <div className="rounded-[14px] border p-6 flex flex-col gap-4" style={CARD_STYLE}>
          <p className="text-[10px] uppercase tracking-widest" style={{ color: "var(--cast-dimmer)", fontFamily: "var(--font-mono)" }}>
            Existing codes {codes ? `(${codes.length})` : ""}
          </p>
          {loadError && <p className="text-xs" style={{ color: "#ef4444" }}>{loadError}</p>}
          {!codes ? (
            <div className="h-6 w-32 animate-pulse rounded" style={{ background: "#2a1f17" }} />
          ) : codes.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--cast-dim)" }}>No promo codes yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {codes.map((pc) => {
                const usedUp = pc.maxRedemptions !== null && pc.redeemedCount >= pc.maxRedemptions;
                const expired = pc.expiresAt !== null && new Date(pc.expiresAt).getTime() < Date.now();
                return (
                  <div
                    key={pc.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3"
                    style={{ background: "var(--iron)", borderColor: "var(--bronze)" }}
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold" style={{ color: "var(--cast)" }}>{pc.code}</span>
                        <StatePill active={pc.active} usedUp={usedUp} expired={expired} />
                      </div>
                      <span className="text-[11px]" style={{ color: "var(--cast-dimmer)" }}>
                        {pc.durationDays}d free · {pc.redeemedCount}
                        {pc.maxRedemptions !== null ? `/${pc.maxRedemptions}` : ""} redeemed
                        {pc.expiresAt ? ` · expires ${fmtDate(pc.expiresAt)}` : ""}
                        {pc.description ? ` · ${pc.description}` : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleActive(pc)}
                        className="text-xs hover:underline underline-offset-2"
                        style={{ color: "var(--cast-dim)" }}
                      >
                        {pc.active ? "Disable" : "Enable"}
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(pc)}
                        className="text-xs hover:underline underline-offset-2"
                        style={{ color: "#ef4444" }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <FoundryFooter />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--cast-dimmer)", fontFamily: "var(--font-mono)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function StatePill({ active, usedUp, expired }: { active: boolean; usedUp: boolean; expired: boolean }) {
  const { label, color, bg } = !active
    ? { label: "Disabled", color: "var(--cast-dimmer)", bg: "rgba(255,255,255,0.05)" }
    : expired
      ? { label: "Expired", color: "#ef4444", bg: "rgba(239,68,68,0.1)" }
      : usedUp
        ? { label: "Used up", color: "var(--ember2)", bg: "rgba(255,122,24,0.12)" }
        : { label: "Active", color: "var(--verify)", bg: "rgba(56,161,105,0.12)" };
  return (
    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide" style={{ color, background: bg }}>
      {label}
    </span>
  );
}
