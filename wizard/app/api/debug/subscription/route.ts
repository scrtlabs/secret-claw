import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { apiBase, authHeader } from "@/lib/bluesnap";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const base = apiBase();

  // Test pfToken
  let pfTokenStatus = 0;
  let pfTokenToken: string | null = null;
  let pfTokenError: string | null = null;
  try {
    const res = await fetch(`${base}/services/2/payment-fields-tokens`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": authHeader() },
      body: "{}",
    });
    pfTokenStatus = res.status;
    pfTokenToken = res.headers.get("location")?.split("/").pop() ?? null;
    if (!res.ok) pfTokenError = await res.text().catch(() => null);
  } catch (e) { pfTokenError = String(e); }

  // Test plan creation
  let planCreateStatus = 0;
  let planCreateBody: unknown = null;
  let planCreateError: string | null = null;
  try {
    const res = await fetch(`${base}/services/2/recurring/plans`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": authHeader() },
      body: JSON.stringify({
        name: "SecretForge Pro",
        currency: "USD",
        recurringChargeAmount: 29,
        chargeFrequency: "MONTHLY",
        trialPeriodDays: 7,
      }),
    });
    planCreateStatus = res.status;
    planCreateBody = await res.json().catch(() => res.text());
    if (!res.ok) planCreateError = JSON.stringify(planCreateBody);
  } catch (e) { planCreateError = String(e); }

  const cachedPlan = await prisma.setting.findUnique({ where: { key: "bluesnap_pro_plan_id" } });

  return NextResponse.json({
    env: process.env.BLUESNAP_ENV ?? "sandbox",
    apiBase: base,
    credentials: {
      username_length: (process.env.BLUESNAP_API_USERNAME ?? "").length,
      password_length: (process.env.BLUESNAP_API_PASSWORD ?? "").length,
    },
    pfToken: { status: pfTokenStatus, token: pfTokenToken?.slice(0, 20) + "…", error: pfTokenError },
    planCreate: { status: planCreateStatus, body: planCreateBody, error: planCreateError },
    cachedPlanId: cachedPlan?.value ?? null,
    envPlanId: process.env.BLUESNAP_PRO_PLAN_ID ?? null,
  });
}
