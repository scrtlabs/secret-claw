/**
 * BlueSnap API client — subscription + payment-fields flows.
 *
 * Required env vars (Railway / .env.local):
 *   BLUESNAP_API_USERNAME
 *   BLUESNAP_API_PASSWORD
 *   BLUESNAP_ENV   ("sandbox" | "production", default "sandbox")
 *
 * The Pro plan ($29/mo, 7-day trial) is created automatically on first use
 * and its ID is cached in the `Setting` table under key "bluesnap_pro_plan_id".
 */

import { prisma } from "./db/prisma";

const PRO_PLAN_PRICE = 29;
const PRO_PLAN_TRIAL_DAYS = 7;

function bsEnv(): "sandbox" | "production" {
  return process.env.BLUESNAP_ENV === "production" ? "production" : "sandbox";
}

export function apiBase(): string {
  return bsEnv() === "production"
    ? "https://ws.bluesnap.com"
    : "https://sandbox.bluesnap.com";
}

export function sdkUrl(): string {
  return bsEnv() === "production"
    ? "https://pay.bluesnap.com/web-sdk/5/bluesnap.js"
    : "https://sandpay.bluesnap.com/web-sdk/5/bluesnap.js";
}

export function authHeader(): string {
  const u = process.env.BLUESNAP_API_USERNAME ?? "";
  const p = process.env.BLUESNAP_API_PASSWORD ?? "";
  return `Basic ${Buffer.from(`${u}:${p}`).toString("base64")}`;
}

async function bsRequest<T = unknown>(
  path: string,
  method: string,
  body?: unknown,
): Promise<{ ok: boolean; status: number; data: T | null }> {
  const res = await fetch(`${apiBase()}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": authHeader(),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data: T | null = null;
  try {
    data = (await res.json()) as T;
  } catch {
    // empty body or non-JSON (e.g. 204)
  }
  return { ok: res.ok, status: res.status, data };
}

// ── Payment fields token ───────────────────────────────────────────────────

/**
 * Returns a pfToken for BlueSnap Hosted Payment Fields.
 * The token is passed to the client-side SDK to render card fields.
 */
export async function getPfToken(): Promise<string | null> {
  const res = await fetch(`${apiBase()}/services/2/payment-fields-tokens`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": authHeader(),
    },
    body: "{}",
  });
  if (!res.ok) return null;
  const location = res.headers.get("location") ?? "";
  const token = location.split("/").pop()?.trim() ?? "";
  return token || null;
}

// ── Plan management ────────────────────────────────────────────────────────

interface BsCreatePlanResponse {
  planId?: number;
}

async function createProPlan(): Promise<string | null> {
  const result = await bsRequest<BsCreatePlanResponse>(
    "/services/2/recurring/plans",
    "POST",
    {
      planName: "SecretForge Pro",
      currency: "USD",
      recurringChargeAmount: PRO_PLAN_PRICE,
      chargeFrequency: "MONTHLY",
      trialPeriodDays: PRO_PLAN_TRIAL_DAYS,
      initialChargeAmount: 0,
      maxNumberOfCharges: 0,
    },
  );
  if (!result.ok || !result.data?.planId) return null;
  return String(result.data.planId);
}

/**
 * Returns the Pro plan ID, creating it in BlueSnap if it doesn't exist yet.
 * Caches the result in the Setting table.
 */
export async function getOrCreateProPlanId(): Promise<string | null> {
  const cached = await prisma.setting.findUnique({
    where: { key: "bluesnap_pro_plan_id" },
  });
  if (cached) return cached.value;

  const planId = await createProPlan();
  if (!planId) return null;

  await prisma.setting.upsert({
    where: { key: "bluesnap_pro_plan_id" },
    update: { value: planId },
    create: { key: "bluesnap_pro_plan_id", value: planId },
  });
  return planId;
}

// ── Subscriptions ──────────────────────────────────────────────────────────

interface BsSubscription {
  subscriptionId?: number;
  vaultedShopperId?: number;
  status?: string; // TRIAL | ACTIVE | CANCELED | PAST_DUE
  nextChargeDate?: string;
  planId?: number;
}

export interface CreatedSubscription {
  subscriptionId: string;
  vaultedShopperId: string;
  status: string;
  nextChargeDate?: string;
}

export async function createSubscription(opts: {
  pfToken: string;
  email: string;
  firstName: string;
  lastName: string;
  planId: string;
}): Promise<CreatedSubscription | null> {
  const result = await bsRequest<BsSubscription>(
    "/services/2/recurring/subscriptions",
    "POST",
    {
      planId: Number(opts.planId),
      payerInfo: {
        email: opts.email,
        firstName: opts.firstName,
        lastName: opts.lastName,
      },
      paymentSource: {
        creditCardInfo: {
          pfToken: opts.pfToken,
        },
      },
    },
  );
  if (!result.ok || !result.data?.subscriptionId) return null;
  const d = result.data;
  return {
    subscriptionId: String(d.subscriptionId),
    vaultedShopperId: String(d.vaultedShopperId ?? ""),
    status: mapBsStatus(d.status ?? ""),
    nextChargeDate: d.nextChargeDate,
  };
}

export async function fetchSubscription(
  bsSubscriptionId: string,
): Promise<BsSubscription | null> {
  const result = await bsRequest<BsSubscription>(
    `/services/2/recurring/subscriptions/${bsSubscriptionId}`,
    "GET",
  );
  return result.ok ? result.data : null;
}

export async function cancelSubscription(bsSubscriptionId: string): Promise<boolean> {
  const result = await bsRequest(
    `/services/2/recurring/subscriptions/${bsSubscriptionId}`,
    "PUT",
    { status: "CANCELED" },
  );
  return result.ok;
}

// ── Status mapping ─────────────────────────────────────────────────────────

export function mapBsStatus(bsStatus: string): string {
  switch (bsStatus.toUpperCase()) {
    case "TRIAL":     return "trialing";
    case "ACTIVE":    return "active";
    case "CANCELED":  return "canceled";
    case "PAST_DUE":  return "past_due";
    default:          return "pending";
  }
}

export function isActive(status: string): boolean {
  return status === "trialing" || status === "active";
}
