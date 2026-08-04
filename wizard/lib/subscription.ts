import { prisma } from "./db/prisma";
import { isActive } from "./bluesnap";
import { PROMO_PLAN_ID } from "./promocode";

type SubscriptionLike = {
  status: string;
  planId: string;
  currentPeriodEnd: Date | null;
};

export function isSubscriptionLive(sub: SubscriptionLike): boolean {
  if (!isActive(sub.status)) return false;
  if (
    sub.planId === PROMO_PLAN_ID &&
    sub.currentPeriodEnd &&
    sub.currentPeriodEnd.getTime() <= Date.now()
  ) {
    return false;
  }
  return true;
}

export async function getSubscription(userSub: string) {
  return prisma.subscription.findUnique({ where: { userSub } });
}

export async function isSubscriptionActive(userSub: string): Promise<boolean> {
  const sub = await getSubscription(userSub);
  if (!sub) return false;
  return isSubscriptionLive(sub);
}
