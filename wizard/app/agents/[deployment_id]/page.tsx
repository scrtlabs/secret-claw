"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { PortalHeader } from "@/components/PortalHeader";
import { StatusPill } from "@/components/StatusPill";
import { TabBar } from "@/components/TabBar";
import { BasicInfoCard } from "@/components/BasicInfoCard";
import { GatewayTokenDisplay } from "@/components/GatewayTokenDisplay";
import { LogsViewer } from "@/components/LogsViewer";
import { SecondaryButton } from "@/components/SecondaryButton";
import type { DeploymentRecord } from "@/lib/types";

const POLL_INTERVAL_MS = 3000;
const LONG_PROVISIONING_THRESHOLD_MS = 6 * 60 * 1000;

interface PageProps {
  params: { deployment_id: string };
}

const PROVISIONING_PHASES = [
  "Submitting your configuration",
  "Configuring your agent",
  "Building your secure environment",
  "Installing your agent",
  "Connecting your channels",
];

function phaseLabel(elapsedSec: number, status: string): string {
  if (status === "submitted") return "Submitting your configuration";
  if (status !== "provisioning") return "";
  if (elapsedSec < 30) return PROVISIONING_PHASES[1]!;
  if (elapsedSec < 90) return PROVISIONING_PHASES[2]!;
  if (elapsedSec < 240) return PROVISIONING_PHASES[3]!;
  return PROVISIONING_PHASES[4]!;
}

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export default function AgentDetailPage({ params }: PageProps) {
  const deploymentId = params.deployment_id;
  const [record, setRecord] = useState<DeploymentRecord | null>(null);
  const [tab, setTab] = useState<"overview" | "logs">("overview");
  const [notFound, setNotFound] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch(`/api/deployment-status/${encodeURIComponent(deploymentId)}`, {
          cache: "no-store",
        });
        if (res.status === 404) {
          if (!cancelled) setNotFound(true);
          return;
        }
        if (!res.ok) return;
        const body = (await res.json()) as DeploymentRecord;
        if (!cancelled) setRecord(body);
      } catch {
        // ignore — next poll will try again
      }
    }
    void poll();
    const id = setInterval(() => {
      if (cancelled) return;
      if (record && (record.status === "ready" || record.status === "failed")) return;
      void poll();
    }, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [deploymentId, record]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (notFound) {
    return (
      <div className="min-h-screen">
        <PortalHeader pageTitle="Agent not found" />
        <main className="mx-auto max-w-3xl px-6 py-10">
          <h1 className="text-xl font-semibold">Deployment not found</h1>
          <p className="mt-2 text-sm text-portal-muted">
            We can't find a deployment with that ID. It may have been lost on dev-server restart
            (the in-memory store is wiped on restart).
          </p>
          <Link
            href="/create-agent"
            className="mt-6 inline-block text-sm text-portal-accent hover:underline"
          >
            ← Create a new agent
          </Link>
        </main>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen">
        <PortalHeader pageTitle="Loading…" />
        <main className="mx-auto max-w-3xl px-6 py-10">
          <p className="text-sm text-portal-muted">Loading deployment…</p>
        </main>
      </div>
    );
  }

  const createdMs = new Date(record.created_at).getTime();
  const elapsedMs = (record.provisioned_at ? new Date(record.provisioned_at).getTime() : now) - createdMs;
  const elapsedSec = Math.max(0, Math.floor(elapsedMs / 1000));
  const longWait =
    (record.status === "submitted" || record.status === "provisioning") &&
    elapsedMs > LONG_PROVISIONING_THRESHOLD_MS;

  return (
    <div className="min-h-screen">
      <PortalHeader pageTitle={`Secret Agent`} />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-portal-text">Secret Agent</h1>
            <p className="mt-1 font-mono text-[11px] text-portal-muted">{deploymentId}</p>
          </div>
          <StatusPill kind={record.status} />
        </div>

        <TabBar
          tabs={[
            { id: "overview", label: "Overview" },
            { id: "logs", label: "Logs" },
          ]}
          active={tab}
          onChange={(id) => setTab(id as "overview" | "logs")}
          className="mb-6"
        />

        {tab === "overview" ? (
          <div className="flex flex-col gap-6">
            <BasicInfoCard
              title="Basic info"
              rows={[
                { label: "Agent name", value: "Secret Agent" },
                {
                  label: "Tier",
                  value: record.tier === "secret" ? "Secret (SecretAI)" : "BYO API",
                },
                {
                  label: "Model",
                  value:
                    record.tier === "secret"
                      ? "qwq:32b"
                      : "Claude Sonnet 4.6",
                  mono: true,
                },
                {
                  label: "Telegram",
                  value: record.telegram_enabled ? "Connected" : "Skipped",
                },
                {
                  label: "Created",
                  value: new Date(record.created_at).toLocaleString(),
                },
                {
                  label: "Deployment ID",
                  value: <span className="font-mono text-xs">{deploymentId}</span>,
                  mono: true,
                },
              ]}
            />

            {record.status === "submitted" || record.status === "provisioning" ? (
              <div className="flex flex-col gap-3 rounded-lg border border-portal-border bg-portal-surface p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-portal-text">
                    {phaseLabel(elapsedSec, record.status)}
                  </span>
                  <span className="text-xs text-portal-muted">{formatElapsed(elapsedMs)} elapsed</span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-portal-bg">
                  <div className="h-full w-1/3 animate-pulse bg-portal-accent" />
                </div>
                {longWait ? (
                  <p className="text-xs text-portal-amber">
                    Taking longer than usual — provisioning typically completes within ~5 minutes.
                    Logs will appear in the Logs tab once the agent boots.
                  </p>
                ) : null}
              </div>
            ) : null}

            {record.status === "ready" ? (
              <>
                <div className="rounded-lg border border-portal-border bg-portal-surface p-5">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-portal-muted">
                    Access
                  </h3>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] uppercase tracking-wider text-portal-muted">
                        Agent URL
                      </span>
                      {record.vm_hostname ? (
                        <a
                          href={`https://${record.vm_hostname}`}
                          target="_blank"
                          rel="noreferrer"
                          className="break-all font-mono text-sm text-portal-accent hover:underline"
                        >
                          https://{record.vm_hostname}
                        </a>
                      ) : (
                        <span className="text-sm text-portal-muted">(awaiting hostname)</span>
                      )}
                    </div>
                    {record.gateway_token ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] uppercase tracking-wider text-portal-muted">
                          Gateway token
                        </span>
                        <GatewayTokenDisplay token={record.gateway_token} />
                      </div>
                    ) : null}
                    {record.telegram_enabled && record.telegram_bot_username ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] uppercase tracking-wider text-portal-muted">
                          Telegram bot
                        </span>
                        <a
                          href={`https://t.me/${record.telegram_bot_username}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-sm text-portal-accent hover:underline"
                        >
                          @{record.telegram_bot_username}
                        </a>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-lg border border-portal-border bg-portal-surface p-5">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-portal-muted">
                    What to do next
                  </h3>
                  <ul className="flex list-disc flex-col gap-2 pl-5 text-sm text-portal-text">
                    <li>
                      Open the agent URL above and authenticate with the gateway token to chat with
                      your agent through the web UI.
                    </li>
                    {record.telegram_enabled ? (
                      <li>
                        Your agent will message you on Telegram within about a minute with a welcome
                        note. Tomorrow at 13:00 UTC you'll receive your first daily news briefing;
                        21:00 UTC brings the evening crypto summary.
                      </li>
                    ) : (
                      <li>
                        Telegram is skipped — your agent is reachable only via the web URL. You can
                        add Telegram later by editing the agent's config through the web UI.
                      </li>
                    )}
                    <li>
                      Manage the underlying VM (resources, attestation, compose file) directly in
                      the{" "}
                      <a
                        href="https://secretai.scrtlabs.com"
                        target="_blank"
                        rel="noreferrer"
                        className="text-portal-accent hover:underline"
                      >
                        SecretAI portal
                      </a>
                      .
                    </li>
                  </ul>
                </div>
              </>
            ) : null}

            {record.status === "failed" ? (
              <div className="rounded-lg border border-portal-red/40 bg-portal-red/5 p-5">
                <h3 className="mb-2 text-sm font-semibold text-portal-red">Provisioning failed</h3>
                <p className="text-xs text-portal-muted">
                  {record.error_message || "An unknown error occurred during provisioning."}
                </p>
                <div className="mt-4">
                  <Link href="/create-agent">
                    <SecondaryButton>Try again</SecondaryButton>
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <LogsViewer
            deploymentId={deploymentId}
            vmHostname={record.vm_hostname}
            status={record.status}
          />
        )}
      </main>
    </div>
  );
}
