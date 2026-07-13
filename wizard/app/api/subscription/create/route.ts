import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { createSubscription, getOrCreateProPlanId } from "@/lib/bluesnap";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.subscription.findUnique({ where: { userSub: user.sub } });
  if (existing && (existing.status === "trialing" || existing.status === "active")) {
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

  const created = await createSubscription({
    pfToken: body.pfToken,
    email: user.email,
    firstName: body.firstName || "SecretForge",
    lastName: body.lastName || "User",
    planId,
  });

  if (!created) {
    return NextResponse.json({ error: "BlueSnap subscription creation failed" }, { status: 502 });
  }

  // Calculate trial end date (7 days from now for "trialing" status)
  const trialEndsAt =
    created.status === "trialing"
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      : null;

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
