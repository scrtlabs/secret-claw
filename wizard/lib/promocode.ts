import { prisma } from "./db/prisma";
import { isActive } from "./bluesnap";

// Subscriptions granted by a promocode carry this planId so we can tell them
// apart from BlueSnap-billed ones (e.g. to skip the BlueSnap cancel call).
export const PROMO_PLAN_ID = "PROMO";

export type RedeemResult =
  | { ok: true; durationDays: number; currentPeriodEnd: string }
  | { ok: false; error: string; status: number };

/** Normalize user-entered codes so "  promo-x " and "PROMO-X" match. */
export function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase();
}

/**
 * Redeem a promocode for `userSub`, granting a free subscription. All checks and
 * writes run in one transaction so the redemption count can't race past its cap.
 */
export async function redeemPromocode(userSub: string, rawCode: string): Promise<RedeemResult> {
  const code = normalizeCode(rawCode);
  if (!code) return { ok: false, error: "Enter a promo code.", status: 400 };

  try {
    return await prisma.$transaction(async (tx) => {
      const promo = await tx.promocode.findUnique({ where: { code } });
      if (!promo || !promo.active) {
        return { ok: false, error: "Invalid or inactive promo code.", status: 404 } as RedeemResult;
      }
      if (promo.expiresAt && promo.expiresAt.getTime() < Date.now()) {
        return { ok: false, error: "This promo code has expired.", status: 410 } as RedeemResult;
      }
      if (promo.maxRedemptions !== null && promo.redeemedCount >= promo.maxRedemptions) {
        return { ok: false, error: "This promo code has been fully redeemed.", status: 409 } as RedeemResult;
      }

      const already = await tx.promoRedemption.findUnique({
        where: { promocodeId_userSub: { promocodeId: promo.id, userSub } },
      });
      if (already) {
        return { ok: false, error: "You've already redeemed this code.", status: 409 } as RedeemResult;
      }

      // Don't let a promo overwrite a live paid subscription.
      const existingSub = await tx.subscription.findUnique({ where: { userSub } });
      if (existingSub && existingSub.planId !== PROMO_PLAN_ID && isActive(existingSub.status)) {
        return { ok: false, error: "You already have an active subscription.", status: 409 } as RedeemResult;
      }

      // Extend from the later of now / an existing promo period so stacking codes adds time.
      const base =
        existingSub?.planId === PROMO_PLAN_ID &&
        existingSub.currentPeriodEnd &&
        existingSub.currentPeriodEnd.getTime() > Date.now()
          ? existingSub.currentPeriodEnd.getTime()
          : Date.now();
      const currentPeriodEnd = new Date(base + promo.durationDays * 24 * 60 * 60 * 1000);
      const bluesnapSubscriptionId = `promo_${promo.code}_${userSub}`;

      await tx.promoRedemption.create({
        data: { promocodeId: promo.id, userSub, code: promo.code },
      });
      await tx.promocode.update({
        where: { id: promo.id },
        data: { redeemedCount: { increment: 1 } },
      });
      await tx.subscription.upsert({
        where: { userSub },
        update: {
          bluesnapSubscriptionId,
          planId: PROMO_PLAN_ID,
          status: "active",
          trialEndsAt: null,
          currentPeriodEnd,
          cancelAtPeriodEnd: false,
        },
        create: {
          userSub,
          bluesnapSubscriptionId,
          planId: PROMO_PLAN_ID,
          status: "active",
          currentPeriodEnd,
        },
      });

      return {
        ok: true,
        durationDays: promo.durationDays,
        currentPeriodEnd: currentPeriodEnd.toISOString(),
      } as RedeemResult;
    });
  } catch {
    return { ok: false, error: "Could not redeem the code. Please try again.", status: 500 };
  }
}
