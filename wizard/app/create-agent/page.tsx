"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

function BackButton() {
  return (
    <button
      type="button"
      onClick={() => window.history.back()}
      className="mb-4 flex items-center gap-1.5 text-xs font-medium transition-colors"
      style={{ color: "var(--cast-dimmer)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--cast)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--cast-dimmer)"; }}
    >
      <span style={{ fontSize: "15px", lineHeight: 1 }}>←</span>
      Back
    </button>
  );
}

import { SECRETAI_KEY_STORAGE_KEY } from "@/components/ui/GoogleSignInButton";
import FoundryNav from "@/components/homepage/foundry/FoundryNav";
import { StatusPill, type StatusKind } from "@/components/StatusPill";
import { SaveKeyModal, type AnthropicKeyView } from "@/components/anthropic/SaveKeyModal";
import { SECRETAI_MODELS, DEFAULT_SECRETAI_MODEL } from "@/lib/types";

interface AiModel { key: string; name: string; }

// A new user who fills out this form but has no subscription is sent to
// /subscribe. We stash the in-progress form here first so that, on return, the
// page rehydrates every field instead of the user landing on an empty form (or
// the dashboard) with their work lost. Session-scoped: cleared once consumed.
const AGENT_DRAFT_STORAGE_KEY = "secretforge:agent-draft";

interface AgentDraft {
  runtime: Runtime;
  tier: Tier;
  secretaiModel: string;
  secretaiKey: string;
  anthropicKey: string;
  selectedKeyId: string | null;
  telegramChoice: TelegramChoice;
  botToken: string;
  chatId: string;
  botUsername?: string;
}

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
  hideCheck,
  onClick,
}: {
  title: string;
  tag?: string;
  description: string;
  selected: boolean;
  hideCheck?: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className="fgopt" aria-pressed={selected} onClick={onClick}>
      <div className="fgopt__top">
        <span className="fgopt__name">{title}</span>
        {tag ? <span className="fgopt__tag">{tag}</span> : null}
      </div>
      <p className="fgopt__body">{description}</p>
      {!hideCheck && <span className="fgopt__check">✓</span>}
    </button>
  );
}

// Inline, full-width status row for the Telegram step. Unlike the header pill it
// wraps long messages (e.g. the "message your bot" instruction) instead of
// overflowing. Amber = checking/waiting, green = linked, red = real error.
function TelegramStatus({ state }: { state: ValidationState }) {
  const palette =
    state.kind === "valid"
      ? { border: "rgba(0,224,138,0.4)", bg: "rgba(0,224,138,0.08)", text: "var(--verify)" }
      : state.kind === "invalid"
        ? { border: "rgba(239,68,68,0.4)", bg: "rgba(239,68,68,0.08)", text: "#ef4444" }
        : { border: "rgba(255,176,32,0.4)", bg: "rgba(255,176,32,0.08)", text: "var(--ember2)" };
  return (
    <div
      className="flex items-start gap-2.5 rounded-md border px-3 py-2.5 text-[12px] leading-relaxed"
      style={{ borderColor: palette.border, background: palette.bg, color: palette.text }}
    >
      <span className="mt-[2px] flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center">
        {state.kind === "valid" ? (
          <span className="text-[13px] leading-none">✓</span>
        ) : state.kind === "invalid" ? (
          <span className="text-[13px] leading-none">✕</span>
        ) : (
          <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: "var(--ember2)" }} />
        )}
      </span>
      <span className="min-w-0 break-words">
        {state.message || (state.kind === "validating" ? "Checking…" : state.kind === "valid" ? "Valid" : "Invalid")}
      </span>
    </div>
  );
}

export default function CreateAgentPage() {
  const router = useRouter();

  const [runtime, setRuntime] = useState<Runtime>("openclaw");
  const [tier, setTier] = useState<Tier>("byo");
  const [secretaiModel, setSecretaiModel] = useState<string>(DEFAULT_SECRETAI_MODEL);
  const [secretaiKey, setSecretaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  // Saved Anthropic keys. null = still loading; [] = none saved yet.
  const [savedKeys, setSavedKeys] = useState<AnthropicKeyView[] | null>(null);
  // The chosen saved key's id, or null when entering a key manually.
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  // Save-key popup: shown once a freshly-typed key validates.
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [saveKeyError, setSaveKeyError] = useState<string | null>(null);
  // Last-4 hint the user explicitly declined to save — so we don't re-nag on
  // every re-validation of the same key.
  const [dismissedSaveHint, setDismissedSaveHint] = useState<string | null>(null);
  const [telegramChoice, setTelegramChoice] = useState<TelegramChoice>("skipped");
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");

  const [secretaiState, setSecretaiState] = useState<ValidationState>({ kind: "idle" });
  const [anthropicState, setAnthropicState] = useState<ValidationState>({ kind: "idle" });
  const [telegramState, setTelegramState] = useState<ValidationState>({ kind: "idle" });
  const [botUsername, setBotUsername] = useState<string | undefined>(undefined);
  // Chat ID is auto-discovered from the bot token by default; this reveals a
  // manual chat-ID field as a fallback (e.g. when the bot has a webhook set).
  const [manualChat, setManualChat] = useState(false);
  // True once the token is valid but we're still waiting for the user to message
  // the bot — drives the automatic re-check loop below.
  const [awaitingChat, setAwaitingChat] = useState(false);
  const telegramPollBusy = useRef(false);

  interface PortalLinkInfo { enabled: boolean; linked: boolean; email?: string; balance?: number }
  const [portalLink, setPortalLink] = useState<PortalLinkInfo | null>(null);
  const [syncing, setSyncing] = useState(false);

  const [aiModels, setAiModels] = useState<AiModel[] | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showInvalidHighlights, setShowInvalidHighlights] = useState(false);

  // "loading" while we check | "active" | "none"
  const [subscriptionStatus, setSubscriptionStatus] = useState<"loading" | "active" | "none">("loading");

  // True while we validate the form before sending the user to checkout.
  const [preparingCheckout, setPreparingCheckout] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // Restore a draft if we're back here after a failed forge on the subscribe
    // page (the happy path forges on /subscribe and never lands here). Leave the
    // draft in storage so a manual retry still has it if this attempt also fails.
    try {
      const rawDraft = sessionStorage.getItem(AGENT_DRAFT_STORAGE_KEY);
      if (rawDraft) {
        const d = JSON.parse(rawDraft) as Partial<AgentDraft>;
        if (d.runtime === "openclaw" || d.runtime === "hermes") setRuntime(d.runtime);
        if (d.tier === "byo" || d.tier === "secret") setTier(d.tier);
        if (typeof d.secretaiModel === "string") setSecretaiModel(d.secretaiModel);
        if (typeof d.secretaiKey === "string") setSecretaiKey(d.secretaiKey);
        if (typeof d.anthropicKey === "string") setAnthropicKey(d.anthropicKey);
        if (d.selectedKeyId === null || typeof d.selectedKeyId === "string") setSelectedKeyId(d.selectedKeyId);
        if (d.telegramChoice === "enabled" || d.telegramChoice === "skipped" || d.telegramChoice === null) {
          setTelegramChoice(d.telegramChoice);
        }
        if (typeof d.botToken === "string") setBotToken(d.botToken);
        if (typeof d.chatId === "string") setChatId(d.chatId);
        if (typeof d.botUsername === "string") setBotUsername(d.botUsername);
      }
    } catch {
      // Corrupt/absent draft; fall through to a fresh form.
    }

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
    void fetch("/api/subscription")
      .then((r) => r.json())
      .then((d: { active?: boolean }) => {
        setSubscriptionStatus(d.active ? "active" : "none");
      })
      .catch(() => setSubscriptionStatus("none"));

    void fetch("/api/anthropic-keys")
      .then((r) => (r.ok ? r.json() : { keys: [] }))
      .then((d: { keys?: AnthropicKeyView[] }) => {
        const keys = d.keys ?? [];
        setSavedKeys(keys);
        // Default to the most recently saved key so returning users don't have
        // to re-enter anything; manual entry stays one click away.
        if (keys.length > 0) setSelectedKeyId(keys[keys.length - 1].id);
      })
      .catch(() => setSavedKeys([]));

    void fetch("/api/aimodels")
      .then((r) => r.json())
      .then((d: { models?: AiModel[] }) => {
        if (d.models && d.models.length > 0) {
          setAiModels(d.models);
          setSecretaiModel((prev) => {
            const ids = d.models!.map((m) => m.key);
            return ids.includes(prev) ? prev : d.models![0].key;
          });
        }
      })
      .catch(() => { /* keep const fallback */ });

    void (async () => {
      try {
        const res = await fetch("/api/portal-link");
        if (!res.ok) return;
        const body = (await res.json()) as { enabled: boolean; linked: boolean; email?: string; balance?: number };
        // If the portal link feature is on but not yet linked, the signIn callback
        // sync may have raced (or lost in a serverless context). Trigger a re-sync
        // now — it's idempotent and completes synchronously server-side.
        if (body.enabled && !body.linked) {
          const retry = await fetch("/api/portal-link", { method: "POST" }).catch(() => null);
          if (retry?.ok) {
            const updated = (await retry.json()) as typeof body;
            setPortalLink(updated);
            return;
          }
        }
        setPortalLink(body);
      } catch {
        // Feature stays hidden; manual key entry still works.
      }
    })();
  }, []);

  const usingLinkedKey = portalLink?.linked === true && secretaiKey.trim() === "";
  const secretaiValid = usingLinkedKey || secretaiState.kind === "valid";
  const hidePortalSection = usingLinkedKey;
  // A selected saved key was already validated at save time, so it counts as
  // valid; otherwise a manually-typed key must pass live validation.
  const anthropicValid =
    tier === "secret" ? true : selectedKeyId ? true : anthropicState.kind === "valid";
  const telegramValid =
    telegramChoice === "skipped" || (telegramChoice === "enabled" && telegramState.kind === "valid");
  const canForge = secretaiValid && anthropicValid && telegramValid && subscriptionStatus === "active";

  function firstInvalidId(): string | null {
    if (!secretaiValid) return "section-secretai";
    if (tier === "byo" && !anthropicValid) return "section-anthropic";
    if (!telegramValid) return "section-telegram";
    return null;
  }

  // The section-header pill shows a SHORT status only — the full message
  // (including the multi-line "message your bot" instruction) is rendered in a
  // wrapping block under the input, so nothing overflows the pill.
  function telegramPillStatus(): ValidationState | undefined {
    if (telegramChoice === "skipped") return { kind: "valid", message: "Skipped" };
    switch (telegramState.kind) {
      case "idle":       return undefined;
      case "valid":      return { kind: "valid", message: botUsername ? `@${botUsername}` : "Linked" };
      case "invalid":    return { kind: "invalid", message: "Needs attention" };
      case "validating": return { kind: "validating", message: awaitingChat ? "Waiting…" : "Checking…" };
      default:           return { kind: telegramState.kind };
    }
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
        // Offer to save a freshly-entered key — but only if it isn't already
        // one of the user's saved keys (matched by its last-4 hint).
        const hint = trimmed.slice(-4);
        const alreadySaved = (savedKeys ?? []).some((k) => k.keyHint === hint);
        if (!alreadySaved && hint !== dismissedSaveHint) {
          setSaveKeyError(null);
          setShowSavePrompt(true);
        }
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

  async function saveAnthropicKey(name: string): Promise<void> {
    setSavingKey(true);
    setSaveKeyError(null);
    try {
      const res = await fetch("/api/anthropic-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, apiKey: anthropicKey.trim() }),
      });
      const body = (await res.json().catch(() => ({}))) as { key?: AnthropicKeyView; error?: string };
      if (!res.ok || !body.key) {
        setSaveKeyError(body.error || `Could not save the key (${res.status}). Try again.`);
        setSavingKey(false);
        return;
      }
      const saved = body.key;
      setSavedKeys((prev) => [...(prev ?? []), saved]);
      // Switch to the newly-saved key: clears the raw input so submit references
      // it by id and the key material never leaves the server again.
      setSelectedKeyId(saved.id);
      setAnthropicKey("");
      setAnthropicState({ kind: "idle" });
      setShowSavePrompt(false);
    } catch (err) {
      setSaveKeyError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSavingKey(false);
    }
  }

  async function validateTelegram(): Promise<ValidationState> {
    const tokenT = botToken.trim();
    const chatT = chatId.trim();
    if (!tokenT) {
      setAwaitingChat(false);
      const s: ValidationState = { kind: "idle" };
      setTelegramState(s);
      return s;
    }
    // Show the spinner, but keep any existing "waiting" message during a poll
    // re-check so the amber block doesn't flicker.
    setTelegramState((prev) => (prev.kind === "validating" ? prev : { kind: "validating" }));
    let result: ValidationState;
    try {
      const res = await fetch("/api/validate-telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send the chat ID only in manual-fallback mode; otherwise the server
        // auto-discovers it from the bot's recent updates and returns it.
        body: JSON.stringify({ botToken: tokenT, chatId: manualChat ? chatT : undefined }),
      });
      const body = (await res.json()) as {
        valid: boolean; pending?: boolean; error?: string; botUsername?: string; chatId?: string; status?: number;
      };
      if (body.valid) {
        setAwaitingChat(false);
        setBotUsername(body.botUsername);
        // Persist the resolved chat ID (auto-discovered) so submit sends it.
        if (body.chatId && !manualChat) setChatId(body.chatId);
        const linkedChat = (manualChat ? chatT : body.chatId) || "";
        result = {
          kind: "valid",
          message: body.botUsername
            ? `Linked · @${body.botUsername}${linkedChat ? ` → ${linkedChat}` : ""}`
            : "Valid",
          botUsername: body.botUsername,
        };
      } else if (body.pending) {
        // Token is good — just waiting for the user to message the bot. Stay in
        // the amber "validating" state; the poll effect re-checks automatically.
        setAwaitingChat(true);
        if (body.botUsername) setBotUsername(body.botUsername);
        result = { kind: "validating", message: body.error || "Waiting for you to message the bot…" };
      } else {
        setAwaitingChat(false);
        result = {
          kind: "invalid",
          message: body.error || "Invalid",
          detail: body.status ? `Telegram returned status ${body.status}` : undefined,
        };
      }
    } catch (err) {
      // A transient network error during the wait shouldn't drop us to red —
      // keep waiting and let the next poll retry.
      if (awaitingChat) {
        result = { kind: "validating", message: "Reconnecting…" };
      } else {
        result = { kind: "invalid", message: "Network error", detail: err instanceof Error ? err.message : String(err) };
      }
    }
    setTelegramState(result);
    return result;
  }

  // Auto-start validation once a plausibly complete token is typed (auto mode
  // only), so the user doesn't have to blur the field to kick it off.
  useEffect(() => {
    if (telegramChoice !== "enabled" || manualChat) return;
    if (telegramState.kind !== "idle") return;
    const t = botToken.trim();
    if (!t.includes(":") || t.length < 20) return;
    const h = setTimeout(() => void validateTelegram(), 600);
    return () => clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [botToken, telegramChoice, manualChat, telegramState.kind]);

  // While waiting for the user to message the bot, re-check automatically every
  // 3s until it turns green (or the token/choice changes and tears this down).
  useEffect(() => {
    if (telegramChoice !== "enabled" || !awaitingChat) return;
    const id = setInterval(() => {
      if (telegramPollBusy.current) return;
      telegramPollBusy.current = true;
      void validateTelegram().finally(() => { telegramPollBusy.current = false; });
    }, 3000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [awaitingChat, telegramChoice]);

  // Validate every field section (reusing already-passed results where we can),
  // flag the sections visually, and return the id of the first one still
  // invalid — or null when the whole form is good. Shared by the Forge button
  // and the "Start free trial" button so both gate on the same checks.
  async function validateSections(): Promise<string | null> {
    setShowInvalidHighlights(true);

    const secretaiP: Promise<ValidationState> = usingLinkedKey
      ? Promise.resolve({ kind: "valid" })
      : secretaiState.kind === "valid"
        ? Promise.resolve(secretaiState)
        : validateSecretai();

    const anthropicP: Promise<ValidationState> =
      tier !== "byo" || selectedKeyId
        ? Promise.resolve({ kind: "valid" })
        : anthropicState.kind === "valid"
          ? Promise.resolve(anthropicState)
          : validateAnthropic();

    let telegramP: Promise<ValidationState>;
    if (telegramChoice === "enabled") {
      telegramP =
        telegramState.kind === "valid"
          ? Promise.resolve(telegramState)
          : validateTelegram();
    } else if (telegramChoice === "skipped") {
      telegramP = Promise.resolve({ kind: "valid" });
    } else {
      const noChoice: ValidationState = {
        kind: "invalid",
        message: "Choose Enable or Skip",
        detail: "Pick one of the Telegram options before continuing.",
      };
      setTelegramState(noChoice);
      telegramP = Promise.resolve(noChoice);
    }

    const [secretaiResult, anthropicResult, telegramResult] = await Promise.all([
      secretaiP,
      anthropicP,
      telegramP,
    ]);

    if (secretaiResult.kind !== "valid") return "section-secretai";
    if (tier === "byo" && anthropicResult.kind !== "valid") return "section-anthropic";
    if (telegramResult.kind !== "valid") return "section-telegram";
    return null;
  }

  function scrollToSection(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function onSubmit() {
    setSubmitError(null);
    setSubmitting(true);

    const target = await validateSections();
    if (target) {
      setSubmitting(false);
      scrollToSection(target);
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
          anthropicApiKey: tier === "byo" && !selectedKeyId ? anthropicKey.trim() : undefined,
          anthropicKeyId: tier === "byo" && selectedKeyId ? selectedKeyId : undefined,
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

  async function goToSubscribe() {
    setSubmitError(null);
    setPreparingCheckout(true);

    const target = await validateSections();
    if (target) {
      setPreparingCheckout(false);
      scrollToSection(target);
      return;
    }

    try {
      const draft: AgentDraft = {
        runtime, tier, secretaiModel,
        secretaiKey, anthropicKey, selectedKeyId,
        telegramChoice, botToken, chatId, botUsername,
      };
      sessionStorage.setItem(AGENT_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // If we can't stash the draft, the user still reaches checkout — they'll
      // just re-enter the form afterward, which is the pre-existing behavior.
    }
    // The subscribe page reads this draft and, on payment success, forges the
    // agent and jumps to its details page — so we don't come back here.
    router.push("/subscribe");
  }

  return (
    <div className="fg-page">
      <FoundryNav />

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8">
          <BackButton />
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
                hideCheck
                onClick={() => { setRuntime("openclaw"); setTier("byo"); }}
              />
              <ForgeOption
                title="OpenClaw + Secret"
                tag="In-enclave"
                description="OpenClaw runtime, SecretAI rytn / gemma4:31b inference (your SecretAI key)."
                selected={runtime === "openclaw" && tier === "secret"}
                hideCheck
                onClick={() => { setRuntime("openclaw"); setTier("secret"); }}
              />
              <ForgeOption
                title="Hermes + BYO API"
                tag="Lean"
                description="Hermes Agent v0.14 runtime, Claude Sonnet 4.6 inference (your Anthropic key)."
                selected={runtime === "hermes" && tier === "byo"}
                hideCheck
                onClick={() => { setRuntime("hermes"); setTier("byo"); }}
              />
              <ForgeOption
                title="Hermes + Secret"
                tag="Lean · In-enclave"
                description="Hermes Agent v0.14 runtime, SecretAI rytn / gemma4:31b inference (your SecretAI key)."
                selected={runtime === "hermes" && tier === "secret"}
                hideCheck
                onClick={() => { setRuntime("hermes"); setTier("secret"); }}
              />
            </div>
          </SectionShell>

          {hidePortalSection ? null : (
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
          )}

          {tier === "byo" ? (
            <SectionShell
              id="section-anthropic"
              index={hidePortalSection ? 2 : 3}
              title="Anthropic API Key"
              helper="Your Anthropic key powers Claude Sonnet 4.6 inference. It's baked into the agent's config inside your attested VM. Save a key to reuse it across deployments — it's stored encrypted at rest."
              status={
                selectedKeyId
                  ? { kind: "valid", message: "Saved key" }
                  : anthropicState.kind === "idle" ? undefined : anthropicState
              }
              invalid={showInvalidHighlights && !anthropicValid}
            >
              {(savedKeys?.length ?? 0) > 0 ? (
                <div className="mb-4 flex flex-col gap-2">
                  {(savedKeys ?? []).map((k) => {
                    const active = selectedKeyId === k.id;
                    return (
                      <button
                        key={k.id}
                        type="button"
                        onClick={() => {
                          setSelectedKeyId(k.id);
                          setAnthropicKey("");
                          setAnthropicState({ kind: "idle" });
                          setShowSavePrompt(false);
                        }}
                        className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition-colors"
                        style={{
                          background: "var(--iron)",
                          borderColor: active ? "var(--molten)" : "var(--bronze)",
                        }}
                      >
                        <span className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-sm font-medium truncate" style={{ color: "var(--cast)" }}>{k.name}</span>
                          <span className="text-[11px] font-mono" style={{ color: "var(--cast-dimmer)" }}>sk-ant-…{k.keyHint}</span>
                        </span>
                        <span
                          className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border text-[10px]"
                          style={{
                            borderColor: active ? "var(--molten)" : "var(--bronze)",
                            background: active ? "var(--molten)" : "transparent",
                            color: active ? "#000" : "transparent",
                          }}
                        >
                          ✓
                        </span>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedKeyId(null);
                      setAnthropicState({ kind: "idle" });
                    }}
                    className="flex items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-left text-sm transition-colors"
                    style={{
                      borderColor: selectedKeyId === null ? "var(--molten)" : "var(--bronze)",
                      color: selectedKeyId === null ? "var(--cast)" : "var(--cast-dim)",
                    }}
                  >
                    <span style={{ fontSize: "15px", lineHeight: 1 }}>+</span>
                    Add a new key
                  </button>
                </div>
              ) : null}

              {selectedKeyId === null ? (
                <>
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
                </>
              ) : null}

              {showSavePrompt ? (
                <SaveKeyModal
                  keyHint={anthropicKey.trim().slice(-4)}
                  busy={savingKey}
                  error={saveKeyError}
                  onSave={(name) => void saveAnthropicKey(name)}
                  onDismiss={() => {
                    setDismissedSaveHint(anthropicKey.trim().slice(-4));
                    setShowSavePrompt(false);
                  }}
                />
              ) : null}
            </SectionShell>
          ) : (
            <SectionShell
              id="section-anthropic"
              index={hidePortalSection ? 2 : 3}
              title="Inference"
              helper="Secret tier runs inference on SecretAI's attested rytn endpoint. Uses your SecretAI portal key, synced automatically at sign-in; no separate API key needed. Pick a model — gemma4:31b is the verified default; the others are experimental (tool-call quirks possible)."
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
                  {(aiModels ?? SECRETAI_MODELS.map((m) => ({ key: m.id, name: m.label }))).map((m) => (
                    <option key={m.key} value={m.key}>{m.name}</option>
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
            index={hidePortalSection ? 3 : 4}
            title="Telegram (optional)"
            helper="Connect Telegram to let your agent message you proactively — daily news brief, evening crypto summary, welcome message. Without Telegram, your agent is reachable only through its web URL."
            status={telegramPillStatus()}
            invalid={showInvalidHighlights && !telegramValid}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ForgeOption
                title="Enable Telegram"
                description="Paste a bot token from @BotFather — we link your chat automatically."
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
              <div className="mt-4 flex flex-col gap-3">
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
                  <code className="font-mono" style={{ color: "var(--cast)" }}>/newbot</code>, and paste the token
                  it gives you below. Then open your new bot and tap{" "}
                  <strong style={{ color: "var(--cast)" }}>Start</strong> (or send it any message) — we&apos;ll
                  link your chat automatically.
                </p>
                <ForgeInput
                  type="text"
                  placeholder="0000000000:..."
                  value={botToken}
                  onChange={(e) => {
                    setBotToken(e.target.value);
                    setAwaitingChat(false);
                    if (telegramState.kind !== "idle") setTelegramState({ kind: "idle" });
                  }}
                  onBlur={() => void validateTelegram()}
                  invalid={telegramState.kind === "invalid"}
                />

                {telegramState.kind !== "idle" && (
                  <TelegramStatus state={telegramState} />
                )}

                {manualChat ? (
                  <div className="flex flex-col gap-2">
                    <span
                      className="text-[11px] uppercase tracking-wider"
                      style={{ color: "var(--cast-dimmer)", fontFamily: "var(--font-mono)" }}
                    >
                      Chat ID
                    </span>
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
                    <button
                      type="button"
                      onClick={() => {
                        setManualChat(false);
                        setChatId("");
                        setAwaitingChat(false);
                        if (telegramState.kind !== "idle") setTelegramState({ kind: "idle" });
                      }}
                      className="self-start text-[11px] hover:underline"
                      style={{ color: "var(--ember2)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    >
                      ← Back to automatic chat detection
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setManualChat(true);
                      setAwaitingChat(false);
                      if (telegramState.kind !== "idle") setTelegramState({ kind: "idle" });
                    }}
                    className="self-start text-[11px] hover:underline"
                    style={{ color: "var(--cast-dimmer)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    Chat not detected? Enter chat ID manually
                  </button>
                )}
              </div>
            ) : null}
          </SectionShell>

          <SectionShell id="section-submit" index={hidePortalSection ? 4 : 5} title="Forge your agent">
            <div className="flex flex-col gap-3">
              {subscriptionStatus === "none" && (
                <div
                  className="rounded-[10px] border p-4"
                  style={{ background: "rgba(255,122,24,0.06)", borderColor: "rgba(255,122,24,0.3)" }}
                >
                  <p className="text-sm font-semibold mb-1" style={{ color: "var(--ember2)" }}>
                    Pro subscription required
                  </p>
                  <p className="text-xs mb-3" style={{ color: "var(--cast-dim)" }}>
                    Deploy agents with a SecretForge Pro plan. 7-day free trial, $29/month after.
                  </p>
                  <button
                    type="button"
                    onClick={() => void goToSubscribe()}
                    disabled={preparingCheckout}
                    className={`fgbtn inline-block ${preparingCheckout ? "fgbtn--idle" : ""}`}
                    style={{ padding: "10px 20px", fontSize: "13px" }}
                  >
                    {preparingCheckout ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Checking…
                      </span>
                    ) : "Start free trial →"}
                  </button>
                </div>
              )}
              {submitError ? (
                <p className="text-xs text-red-400">{submitError}</p>
              ) : null}
              {/* Once the trial CTA is showing (no subscription), it's the only
                  action — hide the Forge button so there aren't two competing
                  primaries. The Forge button returns as soon as the plan is active. */}
              {subscriptionStatus !== "none" ? (
                <button
                  type="submit"
                  disabled={submitting || !canForge}
                  className={`fgbtn self-start ${submitting || !canForge ? "fgbtn--idle" : ""}`}
                  onClick={() => void onSubmit()}
                >
                  {submitting ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Forging…
                    </span>
                  ) : "Forge agent →"}
                </button>
              ) : null}
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
