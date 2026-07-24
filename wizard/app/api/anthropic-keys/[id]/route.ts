import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/session";
import { DuplicateKeyNameError, deleteAnthropicKey, renameAnthropicKey } from "@/lib/anthropic-keys/store";

export const dynamic = "force-dynamic";

const MAX_NAME_LEN = 60;

/** Rename a saved key. */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { name?: string };
  try {
    body = (await request.json()) as { name?: string };
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const name = (body.name || "").trim();
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
  if (name.length > MAX_NAME_LEN) {
    return NextResponse.json({ error: `name must be ${MAX_NAME_LEN} characters or fewer` }, { status: 400 });
  }

  try {
    const key = await renameAnthropicKey({ userSub: user.sub, id: params.id, name });
    if (!key) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ key });
  } catch (err) {
    if (err instanceof DuplicateKeyNameError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("anthropic-keys PATCH failed", err);
    return NextResponse.json({ error: "Rename failed." }, { status: 500 });
  }
}

/** Delete a saved key. */
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const deleted = await deleteAnthropicKey({ userSub: user.sub, id: params.id });
  if (!deleted) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
