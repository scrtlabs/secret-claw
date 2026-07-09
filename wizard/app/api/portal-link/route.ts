import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/session";
import { portalLinkEnabled } from "@/lib/portal-link/config";
import { syncPortalAccount } from "@/lib/portal-link/sync";
import { deletePortalLink, getPortalLinkStatus } from "@/lib/portal-link/store";

export const dynamic = "force-dynamic";

/** Link status (and cached balance) for the signed-in user. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (!portalLinkEnabled()) {
    return NextResponse.json({ enabled: false, linked: false });
  }
  const status = await getPortalLinkStatus(user.sub);
  return NextResponse.json({ enabled: true, ...status });
}

/**
 * Trigger a manual re-sync of the portal account (re-fetches the API key
 * and balance from the portal). Useful if the user rotated their portal key
 * or their balance changed and they want an immediate refresh.
 */
export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (!portalLinkEnabled()) {
    return NextResponse.json({ error: "portal link is not configured" }, { status: 501 });
  }
  if (!user.email) {
    return NextResponse.json({ error: "no email on account — cannot sync" }, { status: 400 });
  }

  await syncPortalAccount({ userSub: user.sub, email: user.email });
  const status = await getPortalLinkStatus(user.sub);
  return NextResponse.json({ enabled: true, ...status });
}

/** Unlink: forget the stored portal key and balance. */
export async function DELETE() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await deletePortalLink(user.sub);
  return NextResponse.json({ linked: false });
}
