import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getSubscription } from "@/lib/subscription";
import { cancelSubscription, isActive } from "@/lib/bluesnap";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await getSubscription(user.sub);
  if (!sub) return NextResponse.json({ status: "none" });

  return NextResponse.json({
    status: sub.status,
    active: isActive(sub.status),
    trialEndsAt: sub.trialEndsAt?.toISOString() ?? null,
    currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
  });
}

export async function DELETE() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await getSubscription(user.sub);
  if (!sub) return NextResponse.json({ error: "No active subscription" }, { status: 404 });
  if (sub.status === "canceled") return NextResponse.json({ error: "Already canceled" }, { status: 400 });

  const ok = await cancelSubscription(sub.bluesnapSubscriptionId);
  if (!ok) return NextResponse.json({ error: "BlueSnap cancel failed" }, { status: 502 });

  await prisma.subscription.update({
    where: { userSub: user.sub },
    data: { cancelAtPeriodEnd: true },
  });

  return NextResponse.json({ canceled: true });
}
