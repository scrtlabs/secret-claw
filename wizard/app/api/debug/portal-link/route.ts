import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    portal_link_encryption_key_set: !!process.env.PORTAL_LINK_ENCRYPTION_KEY,
    portal_sync_secret_set: !!process.env.PORTAL_SYNC_SECRET,
    portal_base_url: process.env.PORTAL_BASE_URL ?? "(not set)",
    enabled: !!(process.env.PORTAL_LINK_ENCRYPTION_KEY && process.env.PORTAL_SYNC_SECRET),
  });
}
