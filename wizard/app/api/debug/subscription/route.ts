import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { apiBase, authHeader } from "@/lib/bluesnap";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const username = process.env.BLUESNAP_API_USERNAME ?? "";
  const password = process.env.BLUESNAP_API_PASSWORD ?? "";
  const env = process.env.BLUESNAP_ENV ?? "sandbox";
  const base = apiBase();

  // Test pfToken call
  let pfTokenStatus = 0;
  let pfTokenLocation: string | null = null;
  let pfTokenError: string | null = null;
  try {
    const res = await fetch(`${base}/services/2/payment-fields-tokens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": authHeader(),
      },
      body: "{}",
    });
    pfTokenStatus = res.status;
    pfTokenLocation = res.headers.get("location");
    if (!res.ok) {
      pfTokenError = await res.text().catch(() => "(unreadable)");
    }
  } catch (e) {
    pfTokenError = String(e);
  }

  // Check cached plan
  const cachedPlan = await prisma.setting.findUnique({ where: { key: "bluesnap_pro_plan_id" } });

  // Test plan creation (dry-run: just check GET /plans works)
  let planListStatus = 0;
  let planListError: string | null = null;
  try {
    const res = await fetch(`${base}/services/2/recurring/plans`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Authorization": authHeader(),
      },
    });
    planListStatus = res.status;
    if (!res.ok) planListError = await res.text().catch(() => "(unreadable)");
  } catch (e) {
    planListError = String(e);
  }

  return NextResponse.json({
    env,
    apiBase: base,
    username_set: !!username,
    username_length: username.length,
    password_set: !!password,
    password_length: password.length,
    pfToken: {
      status: pfTokenStatus,
      location: pfTokenLocation,
      token: pfTokenLocation?.split("/").pop() ?? null,
      error: pfTokenError,
    },
    plan: {
      cachedPlanId: cachedPlan?.value ?? null,
      listStatus: planListStatus,
      listError: planListError,
    },
  });
}
