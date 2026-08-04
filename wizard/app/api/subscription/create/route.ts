import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { createSubscription, getOrCreateProPlanId } from "@/lib/bluesnap";
import { prisma } from "@/lib/db/prisma";
import { isSubscriptionLive } from "@/lib/subscription";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.subscription.findUnique({ where: { userSub: user.sub } });
  if (existing && isSubscriptionLive(existing)) {
    return NextResponse.json({ error: "Already subscribed" }, { status: 409 });
  }

  let body: { pfToken: string; firstName: string; lastName: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!body.pfToken) return NextResponse.json({ error: "pfToken required" }, { status: 400 });

  const planId = await getOrCreateProPlanId();
  if (!planId) return NextResponse.json({ error: "Plan not configured" }, { status: 503 });

  const result = await createSubscription({
    pfToken: body.pfToken,
    email: user.email,
    firstName: body.firstName || "SecretForge",
    lastName: body.lastName || "User",
    planId,
  });

  if (!result.ok) {
    if (result.status === 401 || result.status === 403) {
      return NextResponse.json({ error: "Payment service unavailable" }, { status: 503 });
    }
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const created = result.subscription;

  // Always set trialEndsAt — BlueSnap sometimes returns ACTIVE instead of TRIAL
  // for new subscriptions that include a trial period.
  const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Parse nextChargeDate as currentPeriodEnd
  const currentPeriodEnd = created.nextChargeDate
    ? new Date(created.nextChargeDate)
    : null;

  await prisma.subscription.upsert({
    where: { userSub: user.sub },
    update: {
      bluesnapSubscriptionId: created.subscriptionId,
      bluesnapVaultedShopperId: created.vaultedShopperId || null,
      planId,
      status: created.status,
      trialEndsAt,
      currentPeriodEnd,
      cancelAtPeriodEnd: false,
    },
    create: {
      userSub: user.sub,
      bluesnapSubscriptionId: created.subscriptionId,
      bluesnapVaultedShopperId: created.vaultedShopperId || null,
      planId,
      status: created.status,
      trialEndsAt,
      currentPeriodEnd,
    },
  });

  return NextResponse.json({ status: created.status, trialEndsAt: trialEndsAt?.toISOString() });
}
