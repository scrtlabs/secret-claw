import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    portal_link_encryption_key_set: !!process.env.PORTAL_LINK_ENCRYPTION_KEY,
    portal_link_encryption_key_length: (process.env.PORTAL_LINK_ENCRYPTION_KEY ?? "").length,
    portal_sync_secret_typeof: typeof process.env.PORTAL_SYNC_SECRET,
    portal_sync_secret_length: (process.env.PORTAL_SYNC_SECRET ?? "").length,
    portal_base_url: process.env.PORTAL_BASE_URL ?? process.env.SECRETAI_PORTAL_URL ?? "(not set)",
    secretvm_type_id: process.env.SECRETVM_TYPE_ID ?? "(not set — will send 'default')",
    enabled: !!(process.env.PORTAL_LINK_ENCRYPTION_KEY && process.env.PORTAL_SYNC_SECRET),
  });
}

/** Calls the portal wizard-sync endpoint directly and returns the raw status/body. */
export async function POST() {
  const user = await getSessionUser();
  if (!user?.email) return NextResponse.json({ error: "not signed in or no email" }, { status: 401 });

  const portalBaseUrl = process.env.SECRETAI_PORTAL_URL ?? "https://preview-aidev.scrtlabs.com";
  const secret = process.env.PORTAL_SYNC_SECRET ?? "";

  let status: number;
  let body: unknown;
  try {
    const res = await fetch(`${portalBaseUrl}/api/auth/wizard-sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, secret }),
      signal: AbortSignal.timeout(8000),
    });
    status = res.status;
    body = await res.json().catch(() => res.text());
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }

  return NextResponse.json({ status, body, email: user.email });
}
