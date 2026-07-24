/**
 * AES-256-GCM encryption for saved Anthropic API keys at rest.
 *
 * Reuses the same PORTAL_LINK_ENCRYPTION_KEY secret already provisioned for
 * portal-key encryption — one at-rest encryption key for the wizard is
 * simpler to operate than two, and both are Node-only, server-side secrets.
 */

import crypto from "node:crypto";

const IV_BYTES = 12;

function encryptionKey(): Buffer {
  const secret = process.env.PORTAL_LINK_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("PORTAL_LINK_ENCRYPTION_KEY is not set");
  }
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptAnthropicKey(plaintext: string): string {
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64")}.${ct.toString("base64")}.${tag.toString("base64")}`;
}

export function decryptAnthropicKey(ciphertext: string): string {
  const [version, ivB64, ctB64, tagB64] = ciphertext.split(".");
  if (version !== "v1" || !ivB64 || !ctB64 || !tagB64) {
    throw new Error("unrecognized anthropic key ciphertext format");
  }
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivB64, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(ctB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
