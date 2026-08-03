import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { isUserAdmin } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

// Lightweight check the client uses to decide whether to show admin UI. The
// actual admin endpoints re-check server-side, so this is a hint, not a gate.
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ admin: false });
  return NextResponse.json({ admin: await isUserAdmin(user.sub) });
}
