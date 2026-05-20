import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/demo";

export const dynamic = "force-dynamic";

const DEFAULT_ANTHROPIC_URL = "https://api.anthropic.com";

export async function POST(request: Request) {
  let body: { apiKey?: string };
  try {
    body = (await request.json()) as { apiKey?: string };
  } catch {
    return NextResponse.json({ valid: false, error: "invalid JSON body" }, { status: 400 });
  }
  const apiKey = (body.apiKey || "").trim();
  if (!apiKey) {
    return NextResponse.json({ valid: false, error: "apiKey missing" }, { status: 400 });
  }

  if (isDemoMode()) {
    return NextResponse.json({ valid: true, latencyMs: 220, demo: true });
  }

  if (!apiKey.startsWith("sk-ant-")) {
    return NextResponse.json({ valid: false, error: "expected key to start with 'sk-ant-'" });
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
      return NextResponse.json({ valid: true, latencyMs });
    }
    const errBody = await res.text().catch(() => "");
    return NextResponse.json({
      valid: false,
      status: res.status,
      latencyMs,
      error: res.status === 401 ? "invalid Anthropic API key" : `Anthropic returned ${res.status}`,
      detail: errBody.slice(0, 200),
    });
  } catch (err) {
    return NextResponse.json({
      valid: false,
      status: 0,
      latencyMs: Date.now() - started,
      error: err instanceof Error ? err.message : "network error",
    });
  }
}
