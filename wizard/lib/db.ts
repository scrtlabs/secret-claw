/**
 * Deployment record store.
 *
 * Two backends:
 *  - PrismaDb: primary store backed by Neon Postgres. Survives restarts,
 *    supports per-user listing. Selected when DATABASE_URL is set.
 *  - InMemoryDb: local-dev fallback (no env vars required). State is
 *    lost on dev-server restart.
 */

import type { DeploymentRecord } from "./types";
import { prisma } from "./db/prisma";
import type { Agent } from "@prisma/client";

export interface Db {
  insert(record: DeploymentRecord, userSub?: string): Promise<void>;
  update(id: string, patch: Partial<DeploymentRecord>): Promise<void>;
  get(id: string): Promise<DeploymentRecord | null>;
  listByUser(userSub: string): Promise<DeploymentRecord[]>;
}

// ── Prisma ────────────────────────────────────────────────────────────────────

function agentToRecord(a: Agent): DeploymentRecord {
  return {
    deployment_id: a.deploymentId,
    status: a.status as DeploymentRecord["status"],
    runtime: a.runtime as DeploymentRecord["runtime"],
    tier: a.tier as DeploymentRecord["tier"],
    secretai_model: a.secretaiModel ?? undefined,
    vm_id: a.vmId ?? undefined,
    vm_hostname: a.vmHostname ?? undefined,
    job_id: a.jobId ?? undefined,
    gateway_token: a.gatewayToken ?? undefined,
    telegram_enabled: a.telegramEnabled,
    telegram_bot_username: a.telegramBotUsername ?? undefined,
    error_message: a.errorMessage ?? undefined,
    created_at: a.createdAt.toISOString(),
    provisioned_at: a.provisionedAt?.toISOString() ?? undefined,
  };
}

function patchToData(patch: Partial<DeploymentRecord>): Record<string, unknown> {
  const d: Record<string, unknown> = {};
  if (patch.status !== undefined)               d.status = patch.status;
  if (patch.runtime !== undefined)              d.runtime = patch.runtime;
  if (patch.tier !== undefined)                 d.tier = patch.tier;
  if (patch.secretai_model !== undefined)       d.secretaiModel = patch.secretai_model;
  if (patch.vm_id !== undefined)                d.vmId = patch.vm_id;
  if (patch.vm_hostname !== undefined)          d.vmHostname = patch.vm_hostname;
  if (patch.job_id !== undefined)               d.jobId = patch.job_id;
  if (patch.gateway_token !== undefined)        d.gatewayToken = patch.gateway_token;
  if (patch.telegram_enabled !== undefined)     d.telegramEnabled = patch.telegram_enabled;
  if (patch.telegram_bot_username !== undefined) d.telegramBotUsername = patch.telegram_bot_username;
  if (patch.error_message !== undefined)        d.errorMessage = patch.error_message;
  if (patch.provisioned_at !== undefined)       d.provisionedAt = new Date(patch.provisioned_at);
  return d;
}

class PrismaDb implements Db {
  async insert(record: DeploymentRecord, userSub = "anonymous"): Promise<void> {
    await prisma.agent.create({
      data: {
        deploymentId: record.deployment_id,
        userSub,
        status: record.status,
        runtime: record.runtime,
        tier: record.tier,
        secretaiModel: record.secretai_model ?? null,
        vmId: record.vm_id ?? null,
        vmHostname: record.vm_hostname ?? null,
        jobId: record.job_id ?? null,
        gatewayToken: record.gateway_token ?? null,
        telegramEnabled: record.telegram_enabled,
        telegramBotUsername: record.telegram_bot_username ?? null,
        errorMessage: record.error_message ?? null,
        createdAt: new Date(record.created_at),
        provisionedAt: record.provisioned_at ? new Date(record.provisioned_at) : null,
      },
    });
  }

  async update(id: string, patch: Partial<DeploymentRecord>): Promise<void> {
    await prisma.agent.update({
      where: { deploymentId: id },
      data: patchToData(patch),
    });
  }

  async get(id: string): Promise<DeploymentRecord | null> {
    const a = await prisma.agent.findUnique({ where: { deploymentId: id } });
    return a ? agentToRecord(a) : null;
  }

  async listByUser(userSub: string): Promise<DeploymentRecord[]> {
    const agents = await prisma.agent.findMany({
      where: { userSub },
      orderBy: { createdAt: "desc" },
    });
    return agents.map(agentToRecord);
  }
}

// ── In-memory fallback ────────────────────────────────────────────────────────

declare global {
  // eslint-disable-next-line no-var
  var __secretClawDb: Map<string, DeploymentRecord & { userSub?: string }> | undefined;
}

function store(): Map<string, DeploymentRecord & { userSub?: string }> {
  if (!globalThis.__secretClawDb) {
    globalThis.__secretClawDb = new Map();
  }
  return globalThis.__secretClawDb;
}

class InMemoryDb implements Db {
  async insert(record: DeploymentRecord, userSub?: string): Promise<void> {
    store().set(record.deployment_id, { ...record, userSub });
  }

  async update(id: string, patch: Partial<DeploymentRecord>): Promise<void> {
    const current = store().get(id);
    if (!current) throw new Error(`db.update: deployment ${id} not found`);
    store().set(id, { ...current, ...patch });
  }

  async get(id: string): Promise<DeploymentRecord | null> {
    return store().get(id) ?? null;
  }

  async listByUser(userSub: string): Promise<DeploymentRecord[]> {
    return Array.from(store().values())
      .filter((r) => r.userSub === userSub)
      .sort((a, b) => (b.created_at > a.created_at ? 1 : -1));
  }
}

// ── Export ────────────────────────────────────────────────────────────────────

export const db: Db = process.env.DATABASE_URL ? new PrismaDb() : new InMemoryDb();
