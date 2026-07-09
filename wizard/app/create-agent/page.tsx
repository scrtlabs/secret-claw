"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { SECRETAI_KEY_STORAGE_KEY } from "@/components/ui/GoogleSignInButton";
import FoundryNav from "@/components/homepage/foundry/FoundryNav";
import { StatusPill, type StatusKind } from "@/components/StatusPill";
import { SECRETAI_MODELS, DEFAULT_SECRETAI_MODEL } from "@/lib/types";

type ValidationState = {
  kind: StatusKind;
  message?: string;
  detail?: string;
  vmCount?: number;
  botUsername?: string;
};

type TelegramChoice = "enabled" | "skipped" | null;
type Tier = "byo" | "secret";
type Runtime = "openclaw" | "hermes";

interface SectionShellProps {
  id: string;
  index: number;
  title: string;
  helper?: string;
  status?: ValidationState;
  invalid?: boolean;
  children: React.ReactNode;
}

function SectionShell({ id, index, title, helper, status, invalid, children }: SectionShellProps) {
  return (
    <section
      id={id}
      style={{ background: "linear-gradient(180deg, #1a1613, #141110)" }}
      className={`scroll-mt-20 rounded-[14px] border p-6 transition-colors ${
        invalid
          ? "border-[var(--ember1)] ring-1 ring-[var(--ember1)]/40"
          : "border-[var(--bronze)]"
      }`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold"
            style={{ background: "var(--forge2)", color: "var(--cast-dim)", fontFamily: "var(--font-mono)" }}
          >
            {index}
          </span>
          <h2 className="text-base font-semibold" style={{ color: "var(--cast)" }}>{title}</h2>
        </div>
        {status ? <StatusPill kind={status.kind} label={status.message} /> : null}
      </div>
      {helper ? (
        <p className="mb-4 text-xs leading-relaxed" style={{ color: "var(--cast-dim)" }}>{helper}</p>
      ) : null}
      {children}
      {status?.detail ? <ErrorDetail detail={status.detail} /> : null}
    </section>
  );
}

function ErrorDetail({ detail }: { detail: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 text-xs text-red-400">
      <button type="button" onClick={() => setOpen((o) => !o)} className="underline-offset-2 hover:underline">
        Why?
      </button>
      {open ? (
        <pre
          className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap rounded border p-2 font-mono text-[11px]"
          style={{ borderColor: "var(--ember1)", background: "var(--iron)", color: "var(--cast-dim)" }}
        >
          {detail}
        </pre>
      ) : null}
    </div>
  );
}

function ForgeInput({
  invalid,
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      spellCheck={false}
      autoComplete="off"
      autoCorrect="off"
      style={{ background: "var(--iron)", color: "var(--cast)" }}
      className={`block w-full rounded-md border px-3 py-2 text-sm font-mono placeholder:text-[var(--cast-dimmer)] focus:outline-none focus:ring-1 ${
        invalid
          ? "border-[var(--ember1)] ring-[var(--ember1)]/40"
          : "border-[var(--bronze)] focus:border-[var(--molten)] focus:ring-[var(--molten)]/30"
      } ${className || ""}`}
      {...rest}
    />
  );
}

function ForgeOption({
  title,
  tag,
  description,
  selected,
  onClick,
}: {
  title: string;
  tag?: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className="fgopt" aria-pressed={selected} onClick={onClick}>
      <div className="fgopt__top">
        <span className="fgopt__name">{title}</span>
        {tag ? <span className="fgopt__tag">{tag}</span> : null}
      </div>
      <p className="fgopt__body">{description}</p>
      <span className="fgopt__check">✓</span>
    </button>
  );
}

export default function CreateAgentPage() {
  const router = useRouter();

  const [runtime, setRuntime] = useState<Runtime>("openclaw");
  const [tier, setTier] = useState<Tier>("byo");
  const [secretaiModel, setSecretaiModel] = useState<string>(DEFAULT_SECRETAI_MODEL);
  const [secretaiKey, setSecretaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [telegramChoice, setTelegramChoice] = useState<TelegramChoice>(null);
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");

  const [secretaiState, setSecretaiState] = useState<ValidationState>({ kind: "idle" });
  const [anthropicState, setAnthropicState] = useState<ValidationState>({ kind: "idle" });
  const [telegramState, setTelegramState] = useState<ValidationState>({ kind: "idle" });
  const [botUsername, setBotUsername] = useState<string | undefined>(undefined);

  interface PortalLinkInfo { enabled: boolean; linked: boolean; email?: string; balance?: number }
  const [portalLink, setPortalLink] = useState<PortalLinkInfo | null>(null);
  const [syncing, setSyncing] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showInvalidHighlights, setShowInvalidHighlights] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    try {
      const stashed = sessionStorage.getItem(SECRETAI_KEY_STORAGE_KEY);
      if (stashed) {
        setSecretaiKey(stashed);
        sessionStorage.removeItem(SECRETAI_KEY_STORAGE_KEY);
      }
    } catch {
      // sessionStorage may be unavailable (private windows); no-op.
    }
    try {
      const params = new URLSearchParams(window.location.search);
      const r = params.get("runtime");
      if (r === "openclaw" || r === "hermes") setRuntime(r);
      const t = params.get("tier");
      if (t === "byo" || t === "secret") setTier(t);
    } catch {
      // Malformed/absent query string; keep defaults.
    }
    void (async () => {
      try {
        const res = await fetch("/api/portal-link");
        if (!res.ok) return;
        const body = (await res.json()) as { enabled: boolean; linked: boolean; email?: string; balance?: number };
        setPortalLink(body);
      } catch {
        // Feature stays hidden; manual key entry still works.
      }
    })();
  }, []);

  const usingLinkedKey = portalLink?.linked === true && secretaiKey.trim() === "";
  const secretaiValid = usingLinkedKey || secretaiState.kind === "valid";
  const anthropicValid = tier === "secret" ? true : anthropicState.kind === "valid";
  const telegramValid =
    telegramChoice === "skipped" || (telegramChoice === "enabled" && telegramState.kind === "valid");

  function firstInvalidId(): string | null {
    if (!secretaiValid) return "section-secretai";
    if (tier === "byo" && !anthropicValid) return "section-anthropic";
    if (!telegramValid) return "section-telegram";
    return null;
  }

  async function validateSecretai(): Promise<ValidationState> {
    const trimmed = secretaiKey.trim();
    if (!trimmed) {
      const s: ValidationState = { kind: "idle" };
      setSecretaiState(s);
      return s;
    }
    setSecretaiState({ kind: "validating" });
    let result: ValidationState;
    try {
      const res = await fetch("/api/portal/validate-secretai-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: trimmed }),
      });
      const body = (await res.json()) as { valid: boolean; vmCount?: number; error?: string; status?: number };
      if (body.valid) {
        result = {
          kind: "valid",
          message:
            typeof body.vmCount === "number" && body.vmCount > 0
              ? `Valid · ${body.vmCount} existing VM${body.vmCount === 1 ? "" : "s"}`
              : "Valid",
          vmCount: body.vmCount,
        };
      } else {
        result = {
          kind: "invalid",
          message: body.error || "Invalid key",
          detail: `portal validation returned status ${body.status ?? "unknown"}`,
        };
      }
    } catch (err) {
      result = { kind: "invalid", message: "Network error", detail: err instanceof Error ? err.message : String(err) };
    }
    setSecretaiState(result);
    return result;
  }

  async function validateAnthropic(): Promise<ValidationState> {
    const trimmed = anthropicKey.trim();
    if (!trimmed) {
      const s: ValidationState = { kind: "idle" };
      setAnthropicState(s);
      return s;
    }
    setAnthropicState({ kind: "validating" });
    let result: ValidationState;
    try {
      const res = await fetch("/api/validate-anthropic-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: trimmed }),
      });
      const body = (await res.json()) as { valid: boolean; error?: string; detail?: string; status?: number };
      if (body.valid) {
        result = { kind: "valid", message: "Valid" };
      } else {
        result = {
          kind: "invalid",
          message: body.error || "Invalid key",
          detail: body.detail || `Anthropic returned status ${body.status ?? "unknown"}`,
        };
      }
    } catch (err) {
      result = { kind: "invalid", message: "Network error", detail: err instanceof Error ? err.message : String(err) };
    }
    setAnthropicState(result);
    return result;
  }

  async function validateTelegram(): Promise<ValidationState> {
    const tokenT = botToken.trim();
    const chatT = chatId.trim();
    if (!tokenT && !chatT) {
      const s: ValidationState = { kind: "idle" };
      setTelegramState(s);
      return s;
    }
    if (!tokenT || !chatT) {
      const s: ValidationState = {
        kind: "invalid",
        message: "Both fields required",
        detail: "Bot token and chat ID must both be provided to enable Telegram.",
      };
      setTelegramState(s);
      return s;
    }
    setTelegramState({ kind: "validating" });
    let result: ValidationState;
    try {
      const res = await fetch("/api/validate-telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botToken: tokenT, chatId: chatT }),
      });
      const body = (await res.json()) as { valid: boolean; error?: string; botUsername?: string; status?: number };
      if (body.valid) {
        setBotUsername(body.botUsername);
        result = {
          kind: "valid",
          message: body.botUsername ? `Valid · @${body.botUsername}` : "Valid",
          botUsername: body.botUsername,
        };
      } else {
        result = {
          kind: "invalid",
          message: body.error || "Invalid",
          detail: `Telegram returned status ${body.status ?? "unknown"}`,
        };
      }
    } catch (err) {
      result = { kind: "invalid", message: "Network error", detail: err instanceof Error ? err.message : String(err) };
    }
    setTelegramState(result);
    return result;
  }

  async function onSubmit() {
    setSubmitError(null);
    setShowInvalidHighlights(true);
    setSubmitting(true);

    const secretaiResult: ValidationState = usingLinkedKey
      ? { kind: "valid" }
      : await validateSecretai();
    const anthropicResult: ValidationState =
      tier === "byo" ? await validateAnthropic() : { kind: "valid" };

    let telegramResult: ValidationState;
    if (telegramChoice === "enabled") {
      telegramResult = await validateTelegram();
    } else if (telegramChoice === "skipped") {
      telegramResult = { kind: "valid" };
    } else {
      telegramResult = {
        kind: "invalid",
        message: "Choose Enable or Skip",
        detail: "Pick one of the Telegram options before continuing.",
      };
      setTelegramState(telegramResult);
    }

    let target: string | null = null;
    if (secretaiResult.kind !== "valid") target = "section-secretai";
    else if (tier === "byo" && anthropicResult.kind !== "valid") target = "section-anthropic";
    else if (telegramResult.kind !== "valid") target = "section-telegram";

    if (target) {
      setSubmitting(false);
      const el = document.getElementById(target);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    try {
      const res = await fetch("/api/portal/submit-deployment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runtime,
          tier,
          // Omitted when using a linked account — the server resolves the
          // stored key so it never round-trips through the browser.
          secretaiApiKey: usingLinkedKey ? undefined : secretaiKey.trim(),
          secretaiModel: tier === "secret" ? secretaiModel : undefined,
          anthropicApiKey: tier === "byo" ? anthropicKey.trim() : undefined,
          telegramEnabled: telegramChoice === "enabled",
          telegramBotToken: telegramChoice === "enabled" ? botToken.trim() : undefined,
          telegramChatId: telegramChoice === "enabled" ? chatId.trim() : undefined,
          telegramBotUsername: telegramChoice === "enabled" ? botUsername : undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        setSubmitError(`Submission failed (${res.status}). ${body.slice(0, 200)}`);
        setSubmitting(false);
        return;
      }
      const body = (await res.json()) as { deployment_id: string };
      try {
        if (!usingLinkedKey) {
          sessionStorage.setItem(`secret-claw:apikey:${body.deployment_id}`, secretaiKey.trim());
        }
      } catch {
        // sessionStorage can be blocked in private windows.
      }
      router.push(`/agents/${body.deployment_id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Network error");
      setSubmitting(false);
    }
  }

  return (
    <div className="fg-page">
      <FoundryNav />

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8">
          <span className="fh__eyebrow">New deployment</span>
          <h1
            className="mt-1 text-2xl font-semibold tracking-tight"
            style={{ color: "var(--cast)", fontFamily: "var(--font-archivo)" }}
          >
            Forge your agent
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--cast-dim)" }}>
            Deploy your own private AI agent on SecretVM. Runs in attested confidential compute.
          </p>
        </div>

        <form
          ref={formRef}
          className="flex flex-col gap-6"
          onSubmit={(e) => { e.preventDefault(); void onSubmit(); }}
        >
          <SectionShell id="section-tier" index={1} title="Runtime &amp; Tier">
            <p className="mb-3 text-[11px] leading-relaxed" style={{ color: "var(--cast-dim)" }}>
              Pick a runtime (OpenClaw or Hermes Agent) and an inference tier
              (BYO Anthropic key or hosted SecretAI). All four combinations
              ship the same defaults — Telegram, three pre-installed routines,
              workspace files, HTTPS.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ForgeOption
                title="OpenClaw + BYO API"
                tag="Autonomous"
                description="OpenClaw runtime, Claude Sonnet 4.6 inference (your Anthropic key)."
                selected={runtime === "openclaw" && tier === "byo"}
                onClick={() => { setRuntime("openclaw"); setTier("byo"); }}
              />
              <ForgeOption
                title="OpenClaw + Secret"
                tag="In-enclave"
                description="OpenClaw runtime, SecretAI rytn / gemma4:31b inference (your SecretAI key)."
                selected={runtime === "openclaw" && tier === "secret"}
                onClick={() => { setRuntime("openclaw"); setTier("secret"); }}
              />
              <ForgeOption
                title="Hermes + BYO API"
                tag="Lean"
                description="Hermes Agent v0.14 runtime, Claude Sonnet 4.6 inference (your Anthropic key)."
                selected={runtime === "hermes" && tier === "byo"}
                onClick={() => { setRuntime("hermes"); setTier("byo"); }}
              />
              <ForgeOption
                title="Hermes + Secret"
                tag="Lean · In-enclave"
                description="Hermes Agent v0.14 runtime, SecretAI rytn / gemma4:31b inference (your SecretAI key)."
                selected={runtime === "hermes" && tier === "secret"}
                onClick={() => { setRuntime("hermes"); setTier("secret"); }}
              />
            </div>
          </SectionShell>

          <SectionShell
            id="section-secretai"
            index={2}
            title="SecretAI Portal Account"
            helper={usingLinkedKey ? undefined : "Your portal account is synced automatically at sign-in. If it wasn't detected, paste your API key below."}
            status={
              usingLinkedKey
                ? { kind: "valid", message: "Synced" }
                : secretaiState.kind === "idle" ? undefined : secretaiState
            }
            invalid={showInvalidHighlights && !secretaiValid}
          >
            {portalLink?.enabled && portalLink.linked ? (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--bronze)] px-4 py-3" style={{ background: "var(--iron)" }}>
                <div className="text-sm" style={{ color: "var(--cast)" }}>
                  Synced with SecretAI portal
                  {portalLink.email ? <span style={{ color: "var(--cast-dim)" }}> · {portalLink.email}</span> : null}
                  {portalLink.balance !== undefined ? (
                    <span style={{ color: "var(--ember2)" }}> · balance ${portalLink.balance.toFixed(2)}</span>
                  ) : null}
                  <p className="mt-0.5 text-[11px]" style={{ color: "var(--cast-dimmer)" }}>
                    API key loaded automatically — nothing to paste.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={syncing}
                    onClick={() => {
                      setSyncing(true);
                      fetch("/api/portal-link", { method: "POST" })
                        .then((r) => r.json())
                        .then((b) => setPortalLink(b as PortalLinkInfo))
                        .catch(() => {})
                        .finally(() => setSyncing(false));
                    }}
                    className="text-xs hover:underline underline-offset-2 disabled:opacity-50"
                    style={{ color: "var(--cast-dim)" }}
                  >
                    {syncing ? "Refreshing…" : "Refresh"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      fetch("/api/portal-link", { method: "DELETE" })
                        .then(() => setPortalLink((p) => p ? { ...p, linked: false } : p))
                        .catch(() => {});
                    }}
                    className="text-xs hover:underline underline-offset-2"
                    style={{ color: "var(--cast-dim)" }}
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ) : null}
            {usingLinkedKey ? null : (
              <>
                <ForgeInput
                  type="text"
                  placeholder="sk-..."
                  value={secretaiKey}
                  onChange={(e) => {
                    setSecretaiKey(e.target.value);
                    if (secretaiState.kind !== "idle") setSecretaiState({ kind: "idle" });
                  }}
                  onBlur={() => void validateSecretai()}
                  invalid={secretaiState.kind === "invalid"}
                />
                <p className="mt-2 text-[11px]" style={{ color: "var(--cast-dim)" }}>
                  <a
                    href="https://secretai.scrtlabs.com"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline"
                    style={{ color: "var(--ember2)" }}
                  >
                    Generate a key in the SecretAI portal →
                  </a>
                </p>
              </>
            )}
          </SectionShell>

          {tier === "byo" ? (
            <SectionShell
              id="section-anthropic"
              index={3}
              title="Anthropic API Key"
              helper="Your Anthropic key powers Claude Sonnet 4.6 inference. It's baked into the agent's config inside your attested VM — Anthropic sees the inference, the wizard never persists the key."
              status={anthropicState.kind === "idle" ? undefined : anthropicState}
              invalid={showInvalidHighlights && !anthropicValid}
            >
              <ForgeInput
                type="text"
                placeholder="sk-ant-..."
                value={anthropicKey}
                onChange={(e) => {
                  setAnthropicKey(e.target.value);
                  if (anthropicState.kind !== "idle") setAnthropicState({ kind: "idle" });
                }}
                onBlur={() => void validateAnthropic()}
                invalid={anthropicState.kind === "invalid"}
              />
              <p className="mt-2 text-[11px]" style={{ color: "var(--cast-dim)" }}>
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                  style={{ color: "var(--ember2)" }}
                >
                  Get an Anthropic API key →
                </a>
              </p>
            </SectionShell>
          ) : (
            <SectionShell
              id="section-anthropic"
              index={3}
              title="Inference"
              helper="Secret tier runs inference on SecretAI's attested rytn endpoint. Uses the same SecretAI key from Section 2; no separate API key needed. Pick a model — gemma4:31b is the verified default; the others are experimental (tool-call quirks possible)."
            >
              <div className="flex flex-col gap-2">
                <span
                  className="text-[11px] uppercase tracking-wider"
                  style={{ color: "var(--cast-dimmer)", fontFamily: "var(--font-mono)" }}
                >
                  Model
                </span>
                <select
                  value={secretaiModel}
                  onChange={(e) => setSecretaiModel(e.target.value)}
                  className="rounded-md border px-3 py-2 font-mono text-xs focus:outline-none focus:ring-1"
                  style={{
                    borderColor: "var(--bronze)",
                    background: "var(--iron)",
                    color: "var(--cast)",
                  }}
                >
                  {SECRETAI_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
                <p className="text-[11px] leading-relaxed" style={{ color: "var(--cast-dimmer)" }}>
                  Endpoint:{" "}
                  <span className="font-mono" style={{ color: "var(--cast-dim)" }}>secretai-rytn</span>
                  {" · "}256K context · attested compute
                </p>
              </div>
            </SectionShell>
          )}

          <SectionShell
            id="section-telegram"
            index={4}
            title="Telegram (optional)"
            helper="Connect Telegram to let your agent message you proactively — daily news brief, evening crypto summary, welcome message. Without Telegram, your agent is reachable only through its web URL."
            status={
              telegramChoice === "skipped"
                ? { kind: "valid", message: "Skipped" }
                : telegramState.kind === "idle"
                  ? undefined
                  : telegramState
            }
            invalid={showInvalidHighlights && !telegramValid}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ForgeOption
                title="Enable Telegram"
                description="Paste a bot token from @BotFather and your chat ID."
                selected={telegramChoice === "enabled"}
                onClick={() => {
                  setTelegramChoice("enabled");
                  if (telegramChoice !== "enabled") setTelegramState({ kind: "idle" });
                }}
              />
              <ForgeOption
                title="Skip — add later"
                description="Your agent will be reachable through its web URL only."
                selected={telegramChoice === "skipped"}
                onClick={() => {
                  setTelegramChoice("skipped");
                  setTelegramState({ kind: "valid", message: "Skipped" });
                }}
              />
            </div>

            {telegramChoice === "enabled" ? (
              <div className="mt-4 grid grid-cols-1 gap-5">
                <div className="flex flex-col gap-2">
                  <span
                    className="text-[11px] uppercase tracking-wider"
                    style={{ color: "var(--cast-dimmer)", fontFamily: "var(--font-mono)" }}
                  >
                    Step 1 — Bot token
                  </span>
                  <p className="text-[11px] leading-relaxed" style={{ color: "var(--cast-dim)" }}>
                    Message{" "}
                    <a
                      href="https://t.me/BotFather"
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                      style={{ color: "var(--ember2)" }}
                    >
                      @BotFather
                    </a>{" "}
                    on Telegram, send{" "}
                    <code className="font-mono" style={{ color: "var(--cast)" }}>/newbot</code>, follow the prompts.
                    BotFather replies with a token like{" "}
                    <code className="font-mono" style={{ color: "var(--cast)" }}>1234567890:ABC-def…</code>.
                  </p>
                  <ForgeInput
                    type="text"
                    placeholder="0000000000:..."
                    value={botToken}
                    onChange={(e) => {
                      setBotToken(e.target.value);
                      if (telegramState.kind !== "idle") setTelegramState({ kind: "idle" });
                    }}
                    onBlur={() => void validateTelegram()}
                    invalid={telegramState.kind === "invalid"}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <span
                    className="text-[11px] uppercase tracking-wider"
                    style={{ color: "var(--cast-dimmer)", fontFamily: "var(--font-mono)" }}
                  >
                    Step 2 — Chat ID
                  </span>
                  <p className="text-[11px] leading-relaxed" style={{ color: "var(--cast-dim)" }}>
                    Open Telegram, find your new bot, send it any message
                    (e.g. <code className="font-mono" style={{ color: "var(--cast)" }}>/start</code>), then open
                    this URL and look for{" "}
                    <code className="font-mono" style={{ color: "var(--cast)" }}>chat.id</code> in the JSON:
                  </p>
                  {botToken.trim().includes(":") ? (
                    <a
                      href={`https://api.telegram.org/bot${encodeURIComponent(botToken.trim())}/getUpdates`}
                      target="_blank"
                      rel="noreferrer"
                      className="block break-all rounded-md border px-3 py-2 font-mono text-[11px] transition-colors hover:underline"
                      style={{
                        borderColor: "var(--bronze)",
                        background: "var(--iron)",
                        color: "var(--ember2)",
                      }}
                    >
                      https://api.telegram.org/bot{botToken.trim()}/getUpdates ↗
                    </a>
                  ) : (
                    <span
                      className="block rounded-md border border-dashed px-3 py-2 font-mono text-[11px]"
                      style={{ borderColor: "var(--bronze)", background: "var(--iron)", color: "var(--cast-dimmer)" }}
                    >
                      Paste your bot token above to generate this link
                    </span>
                  )}
                  <ForgeInput
                    type="text"
                    placeholder="-1001234567890 or 1234567890"
                    value={chatId}
                    onChange={(e) => {
                      setChatId(e.target.value);
                      if (telegramState.kind !== "idle") setTelegramState({ kind: "idle" });
                    }}
                    onBlur={() => void validateTelegram()}
                    invalid={telegramState.kind === "invalid"}
                  />
                </div>
              </div>
            ) : null}
          </SectionShell>

          <SectionShell id="section-submit" index={5} title="Forge your agent">
            <div className="flex flex-col gap-3">
              {submitError ? (
                <p className="text-xs text-red-400">{submitError}</p>
              ) : null}
              <button
                type="submit"
                disabled={submitting}
                className={`fgbtn self-start ${submitting ? "fgbtn--idle" : ""}`}
                onClick={() => void onSubmit()}
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Forging…
                  </span>
                ) : "Forge agent →"}
              </button>
              {showInvalidHighlights && firstInvalidId() ? (
                <p className="text-xs" style={{ color: "var(--ember2)" }}>
                  Some sections still need attention — we've scrolled to the first one.
                </p>
              ) : null}
            </div>
          </SectionShell>
        </form>
      </main>
    </div>
  );
}
