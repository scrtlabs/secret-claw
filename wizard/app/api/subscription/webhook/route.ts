/**
 * BlueSnap IPN (webhook) handler for subscription events.
 *
 * BlueSnap sends form-encoded POST requests. Events handled:
 *   RECURRING       — subscription charge (SUCCESS or FAILED)
 *   SUBSCRIPTION_CANCEL — subscription was canceled
 *
 * Set this URL in the BlueSnap dashboard under:
 *   Settings → IPN Settings → IPN URL
 *
 * BlueSnap does not sign IPN payloads with HMAC; we validate by
 * cross-referencing the subscriptionId against our DB.
 */

import { NextResponse } from "next/server";
import { mapBsStatus } from "@/lib/bluesnap";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let params: URLSearchParams;
  try {
    const text = await request.text();
    params = new URLSearchParams(text);
  } catch {
    return NextResponse.json({ error: "Bad body" }, { status: 400 });
  }

  const transactionType = (params.get("transactionType") ?? "").toUpperCase();
  const subscriptionId  = params.get("subscriptionId") ?? "";
  const chargeStatus    = (params.get("chargeStatus") ?? "").toUpperCase();
  const nextChargeDate  = params.get("nextChargeDate");

  if (!subscriptionId) return new NextResponse(null, { status: 200 });

  const record = await prisma.subscription.findUnique({
    where: { bluesnapSubscriptionId: subscriptionId },
  });

  if (!record) {
    // Unknown subscription — acknowledge so BlueSnap stops retrying
    return new NextResponse(null, { status: 200 });
  }

  if (transactionType === "RECURRING") {
    if (chargeStatus === "SUCCESS") {
      await prisma.subscription.update({
        where: { bluesnapSubscriptionId: subscriptionId },
        data: {
          status: "active",
          currentPeriodEnd: nextChargeDate ? new Date(nextChargeDate) : undefined,
        },
      });
    } else if (chargeStatus === "FAILED") {
      await prisma.subscription.update({
        where: { bluesnapSubscriptionId: subscriptionId },
        data: { status: "past_due" },
      });
    }
  } else if (transactionType === "SUBSCRIPTION_CANCEL") {
    await prisma.subscription.update({
      where: { bluesnapSubscriptionId: subscriptionId },
      data: { status: "canceled", cancelAtPeriodEnd: false },
    });
  } else if (transactionType === "SUBSCRIPTION_CHARGE_FAILURE_RETRY_ENDED") {
    await prisma.subscription.update({
      where: { bluesnapSubscriptionId: subscriptionId },
      data: { status: "canceled" },
    });
  }

  return new NextResponse(null, { status: 200 });
}
