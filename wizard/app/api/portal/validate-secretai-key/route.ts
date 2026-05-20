import { NextResponse } from "next/server";
import { validateSecretAiKey } from "@/lib/portal-client";
import { isDemoMode } from "@/lib/demo";

export const dynamic = "force-dynamic";

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
    return NextResponse.json({ valid: true, vmCount: 3, latencyMs: 180, demo: true });
  }

  const result = await validateSecretAiKey(apiKey);
  if (result.valid) {
    return NextResponse.json({ valid: true, vmCount: result.vmCount, latencyMs: result.latencyMs });
  }
  return NextResponse.json(
    {
      valid: false,
      status: result.status,
      latencyMs: result.latencyMs,
      error: result.status === 401 ? "invalid or expired key" : `portal returned ${result.status || "network error"}`,
    },
    { status: 200 },
  );
}
