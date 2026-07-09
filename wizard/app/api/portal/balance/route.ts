import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/session";
import { getPortalLinkStatus } from "@/lib/portal-link/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const status = await getPortalLinkStatus(user.sub);
  if (!status.linked) return NextResponse.json({ linked: false }, { status: 404 });

  return NextResponse.json({ linked: true, balance: status.balance ?? 0 });
}
