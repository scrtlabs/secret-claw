"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Popup shown after a fresh Anthropic key validates, offering to save it under
 * a friendly name. Purely presentational + local name state — the parent owns
 * the actual POST so it can update its own key list on success.
 */
export function SaveKeyModal({
  keyHint,
  busy,
  error,
  onSave,
  onDismiss,
}: {
  keyHint: string;
  busy: boolean;
  error: string | null;
  onSave: (name: string) => void;
  onDismiss: () => void;
}) {
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const trimmed = name.trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onDismiss(); }}
    >
      <div
        className="w-full max-w-sm rounded-[14px] border p-6"
        style={{ background: "linear-gradient(180deg, #1a1613, #141110)", borderColor: "var(--bronze)" }}
      >
        <h3 className="text-base font-semibold" style={{ color: "var(--cast)" }}>
          Save this API key?
        </h3>
        <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--cast-dim)" }}>
          Store this validated key securely (encrypted at rest) so you can reuse it for future
          deployments without pasting it again. Give it a name to recognise it later.
        </p>
        <p className="mt-2 text-[11px] font-mono" style={{ color: "var(--cast-dimmer)" }}>
          Key ending in …{keyHint}
        </p>

        <div className="mt-4 flex flex-col gap-1.5">
          <span
            className="text-[11px] uppercase tracking-wider"
            style={{ color: "var(--cast-dimmer)", fontFamily: "var(--font-mono)" }}
          >
            Key name
          </span>
          <input
            ref={inputRef}
            type="text"
            maxLength={60}
            spellCheck={false}
            placeholder="e.g. Personal, Work, Project X"
            value={name}
            disabled={busy}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && trimmed && !busy) onSave(trimmed); }}
            style={{ background: "var(--iron)", color: "var(--cast)" }}
            className="block w-full rounded-md border border-[var(--bronze)] px-3 py-2 text-sm placeholder:text-[var(--cast-dimmer)] focus:border-[var(--molten)] focus:outline-none focus:ring-1 focus:ring-[var(--molten)]/30"
          />
        </div>

        {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onDismiss}
            className="text-xs px-3 py-2 hover:underline disabled:opacity-50"
            style={{ color: "var(--cast-dim)", background: "none", border: "none", cursor: "pointer" }}
          >
            Don&apos;t save
          </button>
          <button
            type="button"
            disabled={busy || !trimmed}
            onClick={() => onSave(trimmed)}
            className={`fgbtn text-xs px-4 py-2 ${busy || !trimmed ? "fgbtn--idle" : ""}`}
          >
            {busy ? "Saving…" : "Save key"}
          </button>
        </div>
      </div>
    </div>
  );
}

export interface AnthropicKeyView {
  id: string;
  name: string;
  keyHint: string;
  createdAt: string;
}
