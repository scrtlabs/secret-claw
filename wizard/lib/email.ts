import * as postmark from "postmark";
import crypto from "crypto";

const client = new postmark.ServerClient(process.env.POSTMARK_SERVER_TOKEN ?? "");
const FROM = process.env.POSTMARK_FROM_EMAIL ?? "secretai@scrtlabs.com";
const BASE_URL = (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function generateExpiry(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export async function sendConfirmationEmail(email: string, token: string) {
  const link = `${BASE_URL}/confirm-email?token=${token}`;
  await client.sendEmail({
    From: FROM,
    To: email,
    Subject: "Confirm your email address – SecretForge",
    HtmlBody: `
      <p>Hi,</p>
      <p>Click the link below to confirm your SecretForge email address:</p>
      <p><a href="${link}">${link}</a></p>
      <p>This link expires in 24 hours. If you didn't sign up, you can ignore this email.</p>
    `,
    TextBody: `Confirm your SecretForge email:\n${link}\n\nThis link expires in 24 hours.`,
    MessageStream: "outbound",
  });
}

export async function sendWelcomeEmail(email: string) {
  await client.sendEmail({
    From: FROM,
    To: email,
    Subject: "Welcome to SecretForge!",
    HtmlBody: `
      <p>Hi,</p>
      <p>Your email address has been confirmed. Welcome to SecretForge!</p>
      <p><a href="${BASE_URL}/create-agent">Deploy your first agent →</a></p>
    `,
    TextBody: `Welcome to SecretForge!\n\nYour email has been confirmed.\n\nDeploy your first agent: ${BASE_URL}/create-agent`,
    MessageStream: "outbound",
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const link = `${BASE_URL}/reset-password?token=${token}`;
  await client.sendEmail({
    From: FROM,
    To: email,
    Subject: "Reset your password – SecretForge",
    HtmlBody: `
      <p>Hi,</p>
      <p>Click the link below to reset your SecretForge password:</p>
      <p><a href="${link}">${link}</a></p>
      <p>This link expires in 1 hour. If you didn't request a password reset, you can ignore this email.</p>
    `,
    TextBody: `Reset your SecretForge password:\n${link}\n\nThis link expires in 1 hour.`,
    MessageStream: "outbound",
  });
}
