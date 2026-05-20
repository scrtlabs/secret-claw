import { NextResponse } from "next/server";
import crypto from "node:crypto";

import { db } from "@/lib/db";
import { render } from "@/lib/render";
import { createVm, getJobStatus } from "@/lib/portal-client";
import {
  isDemoMode,
  DEMO_BOT_USERNAME,
  DEMO_PROVISIONING_DELAY_MS,
  DEMO_READY_DELAY_MS,
  DEMO_VM_HOSTNAME,
  DEMO_VM_ID,
} from "@/lib/demo";
import type { DeploymentRecord, FormSubmission } from "@/lib/types";

export const dynamic = "force-dynamic";

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

// Async-handler pattern for a long-running Node server (Docker / SecretVM /
// self-hosted): kick off `handlePortalProvisioning` as a non-awaited promise
// after returning the synchronous response. The Node process itself is
// long-running, so the continuation survives without help from a serverless
// framework. `handlePortalProvisioning` wraps all its work in try/catch and
// marks the deployment as `failed` on any error — an unhandled rejection
// here would crash the worker, so we are careful to never let one escape.
//
// On Vercel, the equivalent pattern is `waitUntil(handlePortalProvisioning(...))`
// from `@vercel/functions`. We are not deploying to Vercel for the demo;
// switching back is a one-line change if/when that decision reverses.
export async function POST(request: Request) {
  let body: FormSubmission;
  try {
    body = (await request.json()) as FormSubmission;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  if (!body.secretaiApiKey || !body.anthropicApiKey) {
    return NextResponse.json(
      { error: "secretaiApiKey and anthropicApiKey are required" },
      { status: 400 },
    );
  }

  const deploymentId = crypto.randomUUID();
  const gatewayToken = crypto.randomBytes(32).toString("hex");
  const telegramEnabled = !!body.telegramEnabled;

  const record: DeploymentRecord = {
    deployment_id: deploymentId,
    status: "submitted",
    gateway_token: gatewayToken,
    telegram_enabled: telegramEnabled,
    telegram_bot_username: body.telegramBotUsername,
    created_at: new Date().toISOString(),
  };
  await db.insert(record);

  // Fire-and-forget continuation. handlePortalProvisioning swallows its own
  // errors and persists them on the deployment record; the .catch here is a
  // belt-and-suspenders against any rejection that somehow escapes.
  if (isDemoMode()) {
    void simulateDemoProvisioning(deploymentId, telegramEnabled);
  } else {
    void handlePortalProvisioning({ deploymentId, gatewayToken, form: body }).catch(() => {
      // already handled inside; this `.catch` exists only so the rejection
      // doesn't propagate as an unhandled promise rejection.
    });
  }

  return NextResponse.json({ deployment_id: deploymentId });
}

/**
 * Demo-mode lifecycle: no real portal calls. Drives the deployment record
 * through submitted → provisioning → ready on timers so the user can see
 * each state transition in the UI.
 */
async function simulateDemoProvisioning(deploymentId: string, telegramEnabled: boolean): Promise<void> {
  setTimeout(() => {
    void db.update(deploymentId, { status: "provisioning" }).catch(() => {});
  }, DEMO_PROVISIONING_DELAY_MS);
  setTimeout(() => {
    void db
      .update(deploymentId, {
        status: "ready",
        vm_id: DEMO_VM_ID,
        vm_hostname: DEMO_VM_HOSTNAME,
        provisioned_at: new Date().toISOString(),
        telegram_bot_username: telegramEnabled ? DEMO_BOT_USERNAME : undefined,
      })
      .catch(() => {});
  }, DEMO_READY_DELAY_MS);
}

async function handlePortalProvisioning(opts: {
  deploymentId: string;
  gatewayToken: string;
  form: FormSubmission;
}): Promise<void> {
  const { deploymentId, gatewayToken, form } = opts;

  try {
    await db.update(deploymentId, { status: "provisioning" });

    const rendered = render({
      anthropicApiKey: form.anthropicApiKey,
      telegramBotToken: form.telegramEnabled ? form.telegramBotToken : undefined,
      telegramChatId: form.telegramEnabled ? form.telegramChatId : undefined,
      deploymentId,
      gatewayToken,
    });

    const created = await createVm({
      apiKey: form.secretaiApiKey,
      name: `secret-agent-${deploymentId.split("-")[0]}`,
      vmTypeId: process.env.SECRETVM_TYPE_ID || "default",
      environment: "prod",
      compose: rendered.compose,
    });

    if (!created.ok) {
      await db.update(deploymentId, {
        status: "failed",
        error_message: `portal vm/create returned ${created.status}: ${(created.errorBody || "").slice(0, 200)}`,
      });
      return;
    }

    if (created.vmHostname) {
      await db.update(deploymentId, { vm_id: created.vmId, vm_hostname: created.vmHostname });
    } else {
      await db.update(deploymentId, { vm_id: created.vmId });
    }

    if (!created.jobId) {
      await db.update(deploymentId, {
        status: "ready",
        provisioned_at: new Date().toISOString(),
      });
      return;
    }

    const startedAt = Date.now();
    while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      const job = await getJobStatus({ apiKey: form.secretaiApiKey, jobId: created.jobId });
      if (!job.ok) continue;
      const status = (job.jobStatus || "").toLowerCase();
      if (status === "completed" || status === "success" || status === "succeeded") {
        await db.update(deploymentId, {
          status: "ready",
          provisioned_at: new Date().toISOString(),
        });
        return;
      }
      if (status === "failed" || status === "error") {
        await db.update(deploymentId, {
          status: "failed",
          error_message: `portal background-job reported ${status}`,
        });
        return;
      }
    }

    await db.update(deploymentId, {
      status: "failed",
      error_message: `provisioning timed out after ${Math.round(POLL_TIMEOUT_MS / 60000)} minutes`,
    });
  } catch (err) {
    try {
      await db.update(deploymentId, {
        status: "failed",
        error_message: err instanceof Error ? err.message : "unknown error during provisioning",
      });
    } catch {
      // If even the DB update fails, log and move on — there's nothing else
      // we can do from this context. The detail page will keep polling and
      // see whatever state the record is in.
      // eslint-disable-next-line no-console
      console.error("submit-deployment: failed to persist failure state", err);
    }
  }
}
