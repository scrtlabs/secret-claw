import { NextResponse } from "next/server";
import { portalBaseUrl } from "@/lib/portal-client";

export const dynamic = "force-dynamic";

interface PortalModel {
  key: string;
  name: string;
  url?: string;
  inputPricePerMillion?: number;
  outputPricePerMillion?: number;
}

export async function GET() {
  try {
    const res = await fetch(`${portalBaseUrl()}/api/aimodels`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      return NextResponse.json({ error: "upstream error", models: [] }, { status: 502 });
    }
    const data = (await res.json()) as { models?: PortalModel[] };
    const models = (data.models ?? []).map((m) => ({
      key: m.key,
      name: m.name,
    }));
    return NextResponse.json({ models });
  } catch {
    return NextResponse.json({ error: "unavailable", models: [] }, { status: 503 });
  }
}
