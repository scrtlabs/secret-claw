import { prisma } from "./db/prisma";
import { isActive } from "./bluesnap";

export async function getSubscription(userSub: string) {
  return prisma.subscription.findUnique({ where: { userSub } });
}

export async function isSubscriptionActive(userSub: string): Promise<boolean> {
  const sub = await getSubscription(userSub);
  if (!sub) return false;
  return isActive(sub.status);
}
