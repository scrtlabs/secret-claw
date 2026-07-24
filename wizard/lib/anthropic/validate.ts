/**
 * Shared Anthropic API key validation. Used by both the standalone
 * `/api/validate-anthropic-key` route and the save-key route so the two
 * never drift on what counts as a valid key.
 */

import { isDemoMode } from "@/lib/demo";

const DEFAULT_ANTHROPIC_URL = "https://api.anthropic.com";

export interface AnthropicValidation {
  valid: boolean;
  latencyMs?: number;
  status?: number;
  error?: string;
  detail?: string;
  demo?: boolean;
}

/**
 * Validate an Anthropic API key by making a minimal live `/v1/messages`
 * request. In demo mode it short-circuits to valid.
 */
export async function validateAnthropicKey(apiKeyRaw: string): Promise<AnthropicValidation> {
  const apiKey = (apiKeyRaw || "").trim();
  if (!apiKey) {
    return { valid: false, error: "apiKey missing" };
  }

  if (isDemoMode()) {
    return { valid: true, latencyMs: 220, demo: true };
  }

  if (!apiKey.startsWith("sk-ant-")) {
    return { valid: false, error: "expected key to start with 'sk-ant-'" };
  }

  const base = process.env.ANTHROPIC_API_URL || DEFAULT_ANTHROPIC_URL;
  const started = Date.now();
  try {
    const res = await fetch(`${base}/v1/messages`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1,
        messages: [{ role: "user", content: "ping" }],
      }),
      signal: AbortSignal.timeout(10000),
    });
    const latencyMs = Date.now() - started;
    if (res.ok) {
      return { valid: true, latencyMs };
    }
    const errBody = await res.text().catch(() => "");
    return {
      valid: false,
      status: res.status,
      latencyMs,
      error: res.status === 401 ? "invalid Anthropic API key" : `Anthropic returned ${res.status}`,
      detail: errBody.slice(0, 200),
    };
  } catch (err) {
    return {
      valid: false,
      status: 0,
      latencyMs: Date.now() - started,
      error: err instanceof Error ? err.message : "network error",
    };
  }
}
