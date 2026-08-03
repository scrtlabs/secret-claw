import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { redeemPromocode } from "@/lib/promocode";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { code?: string };
  try {
    body = (await request.json()) as { code?: string };
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const result = await redeemPromocode(user.sub, body.code ?? "");
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({
    redeemed: true,
    durationDays: result.durationDays,
    currentPeriodEnd: result.currentPeriodEnd,
  });
}
