import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getPfToken, sdkUrl, getOrCreateProPlanId } from "@/lib/bluesnap";

export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [pfToken, planId] = await Promise.all([getPfToken(), getOrCreateProPlanId()]);

  if (!pfToken || !planId) {
    return NextResponse.json(
      { error: "Payment service unavailable — check BLUESNAP_API_USERNAME / BLUESNAP_API_PASSWORD" },
      { status: 503 },
    );
  }

  return NextResponse.json({ pfToken, planId, sdkUrl: sdkUrl() });
}
