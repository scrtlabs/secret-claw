import { NextResponse } from "next/server";
import { validateAnthropicKey } from "@/lib/anthropic/validate";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { apiKey?: string };
  try {
    body = (await request.json()) as { apiKey?: string };
  } catch {
    return NextResponse.json({ valid: false, error: "invalid JSON body" }, { status: 400 });
  }
  if (!(body.apiKey || "").trim()) {
    return NextResponse.json({ valid: false, error: "apiKey missing" }, { status: 400 });
  }

  const result = await validateAnthropicKey(body.apiKey || "");
  return NextResponse.json(result);
}
