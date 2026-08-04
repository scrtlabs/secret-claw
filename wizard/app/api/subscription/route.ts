import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getSubscription } from "@/lib/subscription";
import { cancelSubscription, isActive } from "@/lib/bluesnap";
import { PROMO_PLAN_ID } from "@/lib/promocode";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await getSubscription(user.sub);
  if (!sub) return NextResponse.json({ status: "none" });

  // Promo-granted subscriptions have no trial at all — they run to currentPeriodEnd.
  const isPromo = sub.planId === PROMO_PLAN_ID;

  // Fall back to createdAt + 7 days for BlueSnap subscriptions saved before trialEndsAt
  // was always set. Promo rows keep a null trialEndsAt, so they must skip this back-fill —
  // otherwise a promo grant renders as a fabricated 7-day trial.
  const trialEndsAt =
    sub.trialEndsAt?.toISOString() ??
    (!isPromo && isActive(sub.status)
      ? new Date(sub.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
      : null);

  return NextResponse.json({
    status: sub.status,
    active: isActive(sub.status),
    isPromo,
    trialEndsAt,
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

  // Promo-granted subscriptions have no BlueSnap counterpart — end them locally
  // (they simply lapse at currentPeriodEnd; nothing to cancel upstream).
  if (sub.planId === PROMO_PLAN_ID) {
    await prisma.subscription.update({
      where: { userSub: user.sub },
      data: { cancelAtPeriodEnd: true },
    });
    return NextResponse.json({ canceled: true });
  }

  const ok = await cancelSubscription(sub.bluesnapSubscriptionId);
  if (!ok) return NextResponse.json({ error: "BlueSnap cancel failed" }, { status: 502 });

  await prisma.subscription.update({
    where: { userSub: user.sub },
    data: { cancelAtPeriodEnd: true },
  });

  return NextResponse.json({ canceled: true });
}
