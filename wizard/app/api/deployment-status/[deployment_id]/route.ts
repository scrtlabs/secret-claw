import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getJobStatus } from "@/lib/portal-client";
import { resolvePortalApiKey } from "@/lib/portal-link/resolve";

export const dynamic = "force-dynamic";

// On Vercel, the fire-and-forget portal-job poll in submit-deployment
// gets killed when the response returns (no waitUntil + maxDuration cap).
// We replace that with client-driven on-demand polling: the detail page
// hits this route every few seconds, passing the user's SecretAI key in
// the Authorization header. If the record is still provisioning and the
// portal returned a job_id, we ask the portal for the current job status
// and update the record. This makes each poll a quick stateless action
// (read KV → optionally call portal → write KV → return) which fits
// serverless cleanly.
//
// The Authorization header is required for the on-demand update path
// only — without it the route still returns the latest persisted record,
// just doesn't refresh it from the portal. The client (detail page) is
// responsible for stashing the key in sessionStorage during the
// create-agent flow and sending it on every status poll.
export async function GET(
  request: Request,
  context: { params: { deployment_id: string } },
) {
  const id = context.params.deployment_id;
  if (!id) {
    return NextResponse.json({ error: "deployment_id missing" }, { status: 400 });
  }
  let record = await db.get(id);
  if (!record) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // Only refresh if the user supplied their SecretAI key (Authorization
  // header) AND we have something to poll. Otherwise return the record
  // as-is and let the client retry with the key next time.
  if (record.status === "submitted" || record.status === "provisioning") {
    if (record.job_id) {
      const authHeader = request.headers.get("authorization") || "";
      const bearerKey = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
      // Linked-account users never see their key client-side, so nothing
      // arrives in the Authorization header — fall back to the stored key.
      const apiKey = await resolvePortalApiKey(bearerKey || undefined);
      if (apiKey) {
        const job = await getJobStatus({ apiKey, jobId: record.job_id });
        if (job.ok) {
          const status = (job.jobStatus || "").toLowerCase();
          if (status === "completed" || status === "success" || status === "succeeded") {
            await db.update(id, {
              status: "ready",
              provisioned_at: new Date().toISOString(),
            });
            record = (await db.get(id)) ?? record;
          } else if (status === "failed" || status === "error") {
            await db.update(id, {
              status: "failed",
              error_message: `portal background-job reported ${status}`,
            });
            record = (await db.get(id)) ?? record;
          }
        }
        // If !job.ok (e.g. 401 from key revocation) we silently keep
        // the record as-is. Next poll may succeed.
      }
    }
  }

  return NextResponse.json(record);
}
