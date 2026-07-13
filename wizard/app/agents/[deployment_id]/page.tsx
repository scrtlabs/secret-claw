"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import FoundryNav from "@/components/homepage/foundry/FoundryNav";
import FoundryFooter from "@/components/homepage/foundry/FoundryFooter";
import { StatusPill } from "@/components/StatusPill";
import { TabBar } from "@/components/TabBar";
import { BasicInfoCard } from "@/components/BasicInfoCard";
import { GatewayTokenDisplay } from "@/components/GatewayTokenDisplay";
import { LogsViewer } from "@/components/LogsViewer";
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

function ForgeCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[14px] border p-5 ${className || ""}`}
      style={{ background: "linear-gradient(180deg, #1a1613, #141110)", borderColor: "var(--bronze)" }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="mb-3 text-[10px] font-semibold uppercase tracking-widest"
      style={{ color: "var(--cast-dimmer)", fontFamily: "var(--font-mono)" }}
    >
      {children}
    </h3>
  );
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
        const headers: Record<string, string> = {};
        try {
          const apiKey = sessionStorage.getItem(`secret-claw:apikey:${deploymentId}`);
          if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
        } catch {
          // sessionStorage blocked
        }
        const res = await fetch(`/api/deployment-status/${encodeURIComponent(deploymentId)}`, {
          cache: "no-store",
          headers,
        });
        if (res.status === 404) {
          if (!cancelled) setNotFound(true);
          return;
        }
        if (!res.ok) return;
        const body = (await res.json()) as DeploymentRecord;
        if (!cancelled) setRecord(body);
      } catch {
        // ignore — next poll will retry
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
      <div className="fg-page">
        <FoundryNav />
        <main className="mx-auto max-w-3xl px-6 py-16">
          <ForgeCard>
            <p className="text-sm font-semibold" style={{ color: "var(--ember1)" }}>Deployment not found</p>
            <p className="mt-2 text-sm" style={{ color: "var(--cast-dim)" }}>
              We can&apos;t find a deployment with that ID. It may have been lost on server restart.
            </p>
            <Link
              href="/create-agent"
              className="mt-5 inline-block text-sm font-medium transition-colors"
              style={{ color: "var(--ember2)" }}
            >
              ← Forge a new agent
            </Link>
          </ForgeCard>
        </main>
        <FoundryFooter />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="fg-page">
        <FoundryNav />
        <main className="mx-auto max-w-3xl px-6 py-16">
          <p className="text-sm" style={{ color: "var(--cast-dim)" }}>Loading deployment…</p>
        </main>
        <FoundryFooter />
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
    <div className="fg-page">
      <FoundryNav />
      <main className="mx-auto max-w-3xl px-6 py-10">

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p
              className="mb-1 text-[11px] uppercase tracking-widest"
              style={{ color: "var(--cast-dimmer)", fontFamily: "var(--font-mono)" }}
            >
              Secret Agent
            </p>
            <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--cast)" }}>
              {deploymentId.split("-")[0]}
              <span style={{ color: "var(--cast-dimmer)" }}>-{deploymentId.split("-").slice(1).join("-")}</span>
            </h1>
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
          <div className="flex flex-col gap-4">
            <BasicInfoCard
              title="Configuration"
              rows={[
                { label: "Runtime", value: record.runtime === "hermes" ? "Hermes Agent v0.14" : "OpenClaw" },
                { label: "Tier", value: record.tier === "secret" ? "SecretAI" : "BYO API" },
                {
                  label: "Model",
                  value: record.tier === "secret" ? (record.secretai_model || "gemma4:31b") : "Claude Sonnet 4.6",
                  mono: true,
                },
                { label: "Telegram", value: record.telegram_enabled ? "Connected" : "Skipped" },
                { label: "Created", value: new Date(record.created_at).toLocaleString() },
                { label: "Deployment ID", value: <span className="font-mono text-xs">{deploymentId}</span>, mono: true },
              ]}
            />

            {(record.status === "submitted" || record.status === "provisioning") && (
              <ForgeCard>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium" style={{ color: "var(--cast)" }}>
                    {phaseLabel(elapsedSec, record.status)}
                  </span>
                  <span
                    className="text-xs font-mono"
                    style={{ color: "var(--cast-dimmer)" }}
                  >
                    {formatElapsed(elapsedMs)}
                  </span>
                </div>
                <div className="h-0.5 w-full overflow-hidden rounded-full" style={{ background: "var(--bronze)" }}>
                  <div
                    className="h-full w-1/3 animate-pulse rounded-full"
                    style={{ background: "linear-gradient(90deg, var(--ember1), var(--ember2))" }}
                  />
                </div>
                {longWait && (
                  <p className="mt-3 text-xs" style={{ color: "var(--ember2)" }}>
                    Taking longer than usual — provisioning typically completes within ~5 minutes.
                    Logs will appear in the Logs tab once the agent boots.
                  </p>
                )}
              </ForgeCard>
            )}

            {record.status === "ready" && (
              <>
                <ForgeCard>
                  <SectionLabel>Access</SectionLabel>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <span
                        className="text-[10px] uppercase tracking-widest"
                        style={{ color: "var(--cast-dimmer)", fontFamily: "var(--font-mono)" }}
                      >
                        Agent URL
                      </span>
                      {record.vm_hostname ? (
                        <a
                          href={`https://${record.vm_hostname}`}
                          target="_blank"
                          rel="noreferrer"
                          className="break-all font-mono text-sm transition-colors hover:underline"
                          style={{ color: "var(--ember2)" }}
                        >
                          https://{record.vm_hostname}
                        </a>
                      ) : (
                        <span className="text-sm" style={{ color: "var(--cast-dimmer)" }}>(awaiting hostname)</span>
                      )}
                    </div>
                    {record.gateway_token && record.runtime !== "hermes" && (
                      <div className="flex flex-col gap-1">
                        <span
                          className="text-[10px] uppercase tracking-widest"
                          style={{ color: "var(--cast-dimmer)", fontFamily: "var(--font-mono)" }}
                        >
                          Gateway token
                        </span>
                        <GatewayTokenDisplay token={record.gateway_token} />
                      </div>
                    )}
                    {record.telegram_enabled && record.telegram_bot_username && (
                      <div className="flex flex-col gap-1">
                        <span
                          className="text-[10px] uppercase tracking-widest"
                          style={{ color: "var(--cast-dimmer)", fontFamily: "var(--font-mono)" }}
                        >
                          Telegram bot
                        </span>
                        <a
                          href={`https://t.me/${record.telegram_bot_username}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-sm transition-colors hover:underline"
                          style={{ color: "var(--ember2)" }}
                        >
                          @{record.telegram_bot_username}
                        </a>
                      </div>
                    )}
                  </div>
                </ForgeCard>

                <ForgeCard>
                  <SectionLabel>What to do next</SectionLabel>
                  <ul className="flex flex-col gap-3">
                    {[
                      record.runtime === "hermes"
                        ? "Open the agent URL above to reach the Hermes dashboard and chat with your agent through the web UI."
                        : "Open the agent URL above and authenticate with the gateway token to chat with your agent through the web UI.",
                      record.telegram_enabled
                        ? "Your agent will message you on Telegram within about a minute with a welcome note. Tomorrow at 13:00 UTC you'll receive your first daily news briefing; 21:00 UTC brings the evening crypto summary."
                        : "Telegram is skipped — your agent is reachable only via the web URL. You can add Telegram later by editing the agent's config through the web UI.",
                    ].map((text, i) => (
                      <li key={i} className="flex gap-3 text-sm" style={{ color: "var(--cast-dim)" }}>
                        <span
                          className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-sm"
                          style={{ background: "var(--molten)" }}
                        />
                        {text}
                      </li>
                    ))}
                    <li className="flex gap-3 text-sm" style={{ color: "var(--cast-dim)" }}>
                      <span
                        className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-sm"
                        style={{ background: "var(--molten)" }}
                      />
                      Manage the underlying VM (resources, attestation, compose file) directly in the{" "}
                      <a
                        href="https://secretai.scrtlabs.com"
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline"
                        style={{ color: "var(--ember2)" }}
                      >
                        SecretAI portal ↗
                      </a>
                    </li>
                  </ul>
                </ForgeCard>
              </>
            )}

            {record.status === "failed" && (
              <div
                className="rounded-[14px] border p-5"
                style={{
                  background: "rgba(242,96,12,0.05)",
                  borderColor: "rgba(242,96,12,0.3)",
                }}
              >
                <p className="text-sm font-semibold mb-2" style={{ color: "var(--ember1)" }}>
                  Provisioning failed
                </p>
                <p className="text-xs" style={{ color: "var(--cast-dim)" }}>
                  {record.error_message || "An unknown error occurred during provisioning."}
                </p>
                <div className="mt-4">
                  <Link
                    href="/create-agent"
                    className="fgbtn inline-block text-sm"
                    style={{ padding: "10px 20px", fontSize: "14px" }}
                  >
                    Try again
                  </Link>
                </div>
              </div>
            )}
          </div>
        ) : (
          <LogsViewer
            deploymentId={deploymentId}
            vmHostname={record.vm_hostname}
            status={record.status}
          />
        )}
      </main>
      <FoundryFooter />
    </div>
  );
}
