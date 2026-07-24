import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import { decryptAnthropicKey, encryptAnthropicKey } from "./crypto";

/** Public shape returned to the browser — never includes the key material. */
export interface AnthropicKeyView {
  id: string;
  name: string;
  keyHint: string;
  createdAt: string;
}

export class DuplicateKeyNameError extends Error {
  constructor(name: string) {
    super(`a key named "${name}" already exists`);
    this.name = "DuplicateKeyNameError";
  }
}

function toView(k: { id: string; name: string; keyHint: string; createdAt: Date }): AnthropicKeyView {
  return { id: k.id, name: k.name, keyHint: k.keyHint, createdAt: k.createdAt.toISOString() };
}

/** Last 4 chars of the key for display, never the full key. */
function hintFor(apiKey: string): string {
  return apiKey.trim().slice(-4);
}

export async function listAnthropicKeys(userSub: string): Promise<AnthropicKeyView[]> {
  const keys = await prisma.anthropicKey.findMany({
    where: { userSub },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, keyHint: true, createdAt: true },
  });
  return keys.map(toView);
}

export async function saveAnthropicKey(opts: {
  userSub: string;
  name: string;
  apiKey: string;
}): Promise<AnthropicKeyView> {
  const name = opts.name.trim();
  try {
    const created = await prisma.anthropicKey.create({
      data: {
        userSub: opts.userSub,
        name,
        keyCipher: encryptAnthropicKey(opts.apiKey.trim()),
        keyHint: hintFor(opts.apiKey),
      },
      select: { id: true, name: true, keyHint: true, createdAt: true },
    });
    return toView(created);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new DuplicateKeyNameError(name);
    }
    throw err;
  }
}

export async function renameAnthropicKey(opts: {
  userSub: string;
  id: string;
  name: string;
}): Promise<AnthropicKeyView | null> {
  const name = opts.name.trim();
  try {
    // Scope the update to the owning user so one user can't touch another's key.
    const result = await prisma.anthropicKey.updateMany({
      where: { id: opts.id, userSub: opts.userSub },
      data: { name },
    });
    if (result.count === 0) return null;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new DuplicateKeyNameError(name);
    }
    throw err;
  }
  const key = await prisma.anthropicKey.findUnique({
    where: { id: opts.id },
    select: { id: true, name: true, keyHint: true, createdAt: true },
  });
  return key ? toView(key) : null;
}

export async function deleteAnthropicKey(opts: { userSub: string; id: string }): Promise<boolean> {
  const result = await prisma.anthropicKey.deleteMany({
    where: { id: opts.id, userSub: opts.userSub },
  });
  return result.count > 0;
}

/**
 * Decrypted Anthropic API key for a saved key owned by `userSub`, or null when
 * it doesn't exist / isn't theirs. Server-side use only — never return this to
 * the browser.
 */
export async function getAnthropicKeyPlaintext(userSub: string, id: string): Promise<string | null> {
  const key = await prisma.anthropicKey.findFirst({ where: { id, userSub } });
  if (!key) return null;
  return decryptAnthropicKey(key.keyCipher);
}
