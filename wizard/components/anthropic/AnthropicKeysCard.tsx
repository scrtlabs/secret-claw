"use client";

import { useEffect, useRef, useState } from "react";
import type { AnthropicKeyView } from "./SaveKeyModal";

/**
 * Profile card for managing saved Anthropic API keys: list, rename, delete,
 * and add a new (live-validated) key. Key material is never returned by the
 * API — rows show only a name and the last-4 hint.
 */
export function AnthropicKeysCard() {
  const [keys, setKeys] = useState<AnthropicKeyView[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Add-new form
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newKey, setNewKey] = useState("");
  const [addBusy, setAddBusy] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/anthropic-keys")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("failed to load keys"))))
      .then((d: { keys?: AnthropicKeyView[] }) => setKeys(d.keys ?? []))
      .catch(() => { setKeys([]); setLoadError("Could not load your API keys."); });
  }, []);

  async function addKey() {
    const name = newName.trim();
    const apiKey = newKey.trim();
    if (!name || !apiKey) return;
    setAddBusy(true);
    setAddError(null);
    try {
      const res = await fetch("/api/anthropic-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, apiKey }),
      });
      const body = (await res.json()) as { key?: AnthropicKeyView; error?: string };
      if (!res.ok || !body.key) {
        setAddError(body.error || "Could not add the key.");
        return;
      }
      setKeys((prev) => [...(prev ?? []), body.key!]);
      setNewName("");
      setNewKey("");
      setAdding(false);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Network error");
    } finally {
      setAddBusy(false);
    }
  }

  return (
    <div
      className="rounded-[14px] border p-6 flex flex-col gap-5"
      style={{ background: "linear-gradient(180deg, #1a1613, #141110)", borderColor: "var(--bronze)" }}
    >
      <div className="flex items-center justify-between">
        <p
          className="text-[10px] uppercase tracking-widest"
          style={{ color: "var(--cast-dimmer)", fontFamily: "var(--font-mono)" }}
        >
          Anthropic API Keys
        </p>
        {!adding && keys !== null && (
          <button
            type="button"
            onClick={() => { setAdding(true); setAddError(null); }}
            className="text-xs hover:underline underline-offset-2"
            style={{ color: "var(--ember2)" }}
          >
            + Add key
          </button>
        )}
      </div>

      {keys === null ? (
        <div className="flex flex-col gap-2">
          {[140, 110].map((w, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg" style={{ background: "#2a1f17", width: "100%", maxWidth: `${w + 200}px` }} />
          ))}
        </div>
      ) : (
        <>
          {loadError && <p className="text-xs text-red-400">{loadError}</p>}

          {keys.length === 0 && !adding ? (
            <p className="text-sm" style={{ color: "var(--cast-dim)" }}>
              No saved keys yet. Save an Anthropic key here or while forging an agent to reuse it later.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {keys.map((k) => (
                <KeyRow
                  key={k.id}
                  item={k}
                  onRenamed={(updated) => setKeys((prev) => (prev ?? []).map((x) => (x.id === updated.id ? updated : x)))}
                  onDeleted={(id) => setKeys((prev) => (prev ?? []).filter((x) => x.id !== id))}
                />
              ))}
            </div>
          )}

          {adding && (
            <div
              className="rounded-[10px] border p-4 flex flex-col gap-3"
              style={{ background: "var(--iron)", borderColor: "var(--bronze)" }}
            >
              <input
                type="text"
                maxLength={60}
                placeholder="Key name (e.g. Personal)"
                value={newName}
                disabled={addBusy}
                onChange={(e) => setNewName(e.target.value)}
                className="block w-full rounded-md border border-[var(--bronze)] px-3 py-2 text-sm placeholder:text-[var(--cast-dimmer)] focus:border-[var(--molten)] focus:outline-none focus:ring-1 focus:ring-[var(--molten)]/30"
                style={{ background: "#141110", color: "var(--cast)" }}
              />
              <input
                type="text"
                spellCheck={false}
                autoComplete="off"
                placeholder="sk-ant-..."
                value={newKey}
                disabled={addBusy}
                onChange={(e) => setNewKey(e.target.value)}
                className="block w-full rounded-md border border-[var(--bronze)] px-3 py-2 text-sm font-mono placeholder:text-[var(--cast-dimmer)] focus:border-[var(--molten)] focus:outline-none focus:ring-1 focus:ring-[var(--molten)]/30"
                style={{ background: "#141110", color: "var(--cast)" }}
              />
              {addError && <p className="text-xs text-red-400">{addError}</p>}
              <p className="text-[11px]" style={{ color: "var(--cast-dimmer)" }}>
                The key is validated with Anthropic before it&apos;s saved (encrypted at rest).
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={addBusy}
                  onClick={() => { setAdding(false); setNewName(""); setNewKey(""); setAddError(null); }}
                  className="text-xs px-3 py-2 hover:underline disabled:opacity-50"
                  style={{ color: "var(--cast-dim)", background: "none", border: "none", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={addBusy || !newName.trim() || !newKey.trim()}
                  onClick={() => void addKey()}
                  className={`fgbtn text-xs px-4 py-2 ${addBusy || !newName.trim() || !newKey.trim() ? "fgbtn--idle" : ""}`}
                >
                  {addBusy ? "Validating…" : "Save key"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function KeyRow({
  item,
  onRenamed,
  onDeleted,
}: {
  item: AnthropicKeyView;
  onRenamed: (updated: AnthropicKeyView) => void;
  onDeleted: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  async function rename() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === item.name) { setEditing(false); setName(item.name); return; }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/anthropic-keys/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const body = (await res.json()) as { key?: AnthropicKeyView; error?: string };
      if (!res.ok || !body.key) { setError(body.error || "Rename failed."); return; }
      onRenamed(body.key);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/anthropic-keys/${item.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error || "Delete failed.");
        setBusy(false);
        return;
      }
      onDeleted(item.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setBusy(false);
    }
  }

  return (
    <div
      className="rounded-lg border px-4 py-3 flex flex-col gap-2"
      style={{ background: "var(--iron)", borderColor: "var(--bronze)" }}
    >
      <div className="flex items-center justify-between gap-3">
        {editing ? (
          <input
            ref={inputRef}
            type="text"
            maxLength={60}
            value={name}
            disabled={busy}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void rename(); if (e.key === "Escape") { setEditing(false); setName(item.name); } }}
            className="min-w-0 flex-1 rounded-md border border-[var(--bronze)] px-2 py-1 text-sm focus:border-[var(--molten)] focus:outline-none focus:ring-1 focus:ring-[var(--molten)]/30"
            style={{ background: "#141110", color: "var(--cast)" }}
          />
        ) : (
          <span className="flex flex-col gap-0.5 min-w-0">
            <span className="text-sm font-medium truncate" style={{ color: "var(--cast)" }}>{item.name}</span>
            <span className="text-[11px] font-mono" style={{ color: "var(--cast-dimmer)" }}>sk-ant-…{item.keyHint}</span>
          </span>
        )}

        <div className="flex items-center gap-3 flex-shrink-0">
          {editing ? (
            <>
              <button type="button" disabled={busy} onClick={() => void rename()} className="text-xs hover:underline disabled:opacity-50" style={{ color: "var(--verify)" }}>Save</button>
              <button type="button" disabled={busy} onClick={() => { setEditing(false); setName(item.name); setError(null); }} className="text-xs hover:underline disabled:opacity-50" style={{ color: "var(--cast-dim)" }}>Cancel</button>
            </>
          ) : confirmDelete ? (
            <>
              <button type="button" disabled={busy} onClick={() => void remove()} className="text-xs hover:underline disabled:opacity-50" style={{ color: "#ef4444" }}>{busy ? "Deleting…" : "Confirm"}</button>
              <button type="button" disabled={busy} onClick={() => setConfirmDelete(false)} className="text-xs hover:underline disabled:opacity-50" style={{ color: "var(--cast-dim)" }}>Cancel</button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => setEditing(true)} className="text-xs hover:underline" style={{ color: "var(--cast-dim)" }}>Rename</button>
              <button type="button" onClick={() => setConfirmDelete(true)} className="text-xs hover:underline" style={{ color: "var(--cast-dim)" }}>Delete</button>
            </>
          )}
        </div>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
