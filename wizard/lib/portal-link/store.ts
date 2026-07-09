import { prisma } from "@/lib/db/prisma";
import { decryptPortalKey, encryptPortalKey } from "./crypto";

export interface PortalLinkStatus {
  linked: boolean;
  email?: string;
  balance?: number;
  linkedAt?: string;
}

export async function getPortalLinkStatus(userSub: string): Promise<PortalLinkStatus> {
  const link = await prisma.portalLink.findUnique({ where: { userSub } });
  if (!link) return { linked: false };
  return {
    linked: true,
    email: link.email ?? undefined,
    balance: link.balance,
    linkedAt: link.linkedAt.toISOString(),
  };
}

export async function savePortalLink(opts: {
  userSub: string;
  email?: string;
  apiKey: string;
  balance?: number;
}): Promise<void> {
  const apiKeyCipher = encryptPortalKey(opts.apiKey);
  await prisma.portalLink.upsert({
    where: { userSub: opts.userSub },
    create: { userSub: opts.userSub, email: opts.email, apiKeyCipher, balance: opts.balance ?? 0 },
    update: { email: opts.email, apiKeyCipher, balance: opts.balance ?? 0 },
  });
}

export async function deletePortalLink(userSub: string): Promise<void> {
  await prisma.portalLink.deleteMany({ where: { userSub } });
}

/**
 * Decrypted portal API key for a wizard user, or null when not linked.
 * Server-side use only — never return this value to the browser.
 */
export async function getLinkedPortalApiKey(userSub: string): Promise<string | null> {
  const link = await prisma.portalLink.findUnique({ where: { userSub } });
  if (!link) return null;
  return decryptPortalKey(link.apiKeyCipher);
}
