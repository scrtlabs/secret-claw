"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";

import FoundryNav from "@/components/homepage/foundry/FoundryNav";
import FoundryFooter from "@/components/homepage/foundry/FoundryFooter";
import { StatusPill } from "@/components/StatusPill";
import type { DeploymentRecord } from "@/lib/types";

function agentName(r: DeploymentRecord): string {
  return `secret-agent-${r.runtime}-${r.deployment_id.split("-")[0]}`;
}

function ForgeCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[14px] border p-5 ${className ?? ""}`}
      style={{ background: "linear-gradient(180deg, #1a1613, #141110)", borderColor: "var(--bronze)" }}
    >
      {children}
    </div>
  );
}

export default function AgentsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [agents, setAgents] = useState<DeploymentRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/agents")
      .then((r) => r.json())
      .then((data: DeploymentRecord[]) => {
        const sorted = [...data].sort((a, b) =>
          agentName(a).localeCompare(agentName(b))
        );
        setAgents(sorted);
      })
      .catch(() => setError("Failed to load agents."));
  }, [status]);

  return (
    <div className="fg-page">
      <FoundryNav />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p
              className="mb-1 text-[11px] uppercase tracking-widest"
              style={{ color: "var(--cast-dimmer)", fontFamily: "var(--font-mono)" }}
            >
              Your deployments
            </p>
            <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--cast)" }}>
              Secret Agents
            </h1>
          </div>
          <Link href="/create-agent" className="fgbtn" style={{ padding: "10px 20px", fontSize: "14px" }}>
            Forge new →
          </Link>
        </div>

        {status === "loading" || agents === null ? (
          <p className="text-sm" style={{ color: "var(--cast-dim)" }}>
            {error ?? "Loading…"}
          </p>
        ) : agents.length === 0 ? (
          <ForgeCard>
            <p className="text-sm font-medium mb-1" style={{ color: "var(--cast)" }}>No agents yet</p>
            <p className="text-sm mb-4" style={{ color: "var(--cast-dim)" }}>
              Forge your first secret agent to get started.
            </p>
            <Link href="/create-agent" className="fgbtn inline-block" style={{ padding: "10px 20px", fontSize: "14px" }}>
              Forge agent →
            </Link>
          </ForgeCard>
        ) : (
          <div className="flex flex-col gap-3">
            {agents.map((agent) => {
              const name = agentName(agent);
              const createdDate = new Date(agent.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              return (
                <Link
                  key={agent.deployment_id}
                  href={`/agents/${agent.deployment_id}`}
                  className="block rounded-[14px] border p-4 transition-colors"
                  style={{
                    background: "linear-gradient(180deg, #1a1613, #141110)",
                    borderColor: "var(--bronze)",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--ember2)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--bronze)";
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p
                        className="font-mono text-sm font-semibold truncate"
                        style={{ color: "var(--cast)" }}
                      >
                        {name}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                        <span
                          className="text-[11px] uppercase tracking-widest"
                          style={{ color: "var(--cast-dimmer)", fontFamily: "var(--font-mono)" }}
                        >
                          {agent.runtime === "hermes" ? "Hermes" : "OpenClaw"} · {agent.tier === "secret" ? "SecretAI" : "BYO"}
                        </span>
                        {agent.vm_hostname && (
                          <span
                            className="text-[11px] font-mono truncate"
                            style={{ color: "var(--cast-dimmer)" }}
                          >
                            {agent.vm_hostname}
                          </span>
                        )}
                        <span
                          className="text-[11px]"
                          style={{ color: "var(--cast-dimmer)" }}
                        >
                          {createdDate}
                        </span>
                      </div>
                    </div>
                    <StatusPill kind={agent.status} className="flex-shrink-0" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <FoundryFooter />
    </div>
  );
}
