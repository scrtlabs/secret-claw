import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/session";
import { validateAnthropicKey } from "@/lib/anthropic/validate";
import { DuplicateKeyNameError, listAnthropicKeys, saveAnthropicKey } from "@/lib/anthropic-keys/store";

export const dynamic = "force-dynamic";

const MAX_NAME_LEN = 60;

/** List the signed-in user's saved Anthropic keys (metadata only). */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const keys = await listAnthropicKeys(user.sub);
  return NextResponse.json({ keys });
}

/**
 * Save a new Anthropic key. Validates it live before persisting so we never
 * store a dead key. Returns the created key's metadata (never the key itself).
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { name?: string; apiKey?: string };
  try {
    body = (await request.json()) as { name?: string; apiKey?: string };
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const name = (body.name || "").trim();
  const apiKey = (body.apiKey || "").trim();
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
  if (name.length > MAX_NAME_LEN) {
    return NextResponse.json({ error: `name must be ${MAX_NAME_LEN} characters or fewer` }, { status: 400 });
  }
  if (!apiKey) return NextResponse.json({ error: "apiKey is required" }, { status: 400 });

  const validation = await validateAnthropicKey(apiKey);
  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error || "invalid Anthropic API key", detail: validation.detail },
      { status: 400 },
    );
  }

  try {
    const key = await saveAnthropicKey({ userSub: user.sub, name, apiKey });
    return NextResponse.json({ key }, { status: 201 });
  } catch (err) {
    if (err instanceof DuplicateKeyNameError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
}
