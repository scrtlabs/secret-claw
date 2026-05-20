import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isDemoMode, demoLogLines } from "@/lib/demo";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: { deployment_id: string } },
) {
  const id = context.params.deployment_id;
  const record = await db.get(id);
  if (!record) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (record.status !== "ready" || !record.vm_hostname) {
    return NextResponse.json({ lines: [] });
  }

  if (isDemoMode()) {
    return NextResponse.json({ lines: demoLogLines() });
  }

  // OpenClaw's documented log endpoint is TBD — see README Known Gaps.
  // For now we attempt a best-effort GET; on failure we return an
  // empty/error payload that the LogsViewer surfaces gracefully.
  const url = `https://${record.vm_hostname}/_logs?n=200`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${record.gateway_token || ""}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      return NextResponse.json({ error: `gateway returned ${res.status}` });
    }
    const text = await res.text();
    const lines = text.split(/\r?\n/).filter(Boolean).slice(-200);
    return NextResponse.json({ lines });
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : "gateway unreachable",
    });
  }
}
