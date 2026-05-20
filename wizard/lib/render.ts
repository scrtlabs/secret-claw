/**
 * TypeScript port of `deploys/byo/scripts/render.py`.
 *
 * Produces a single docker-compose.yml string that the wizard backend
 * submits to the SecretAI portal via `POST /api/vm/create`. Byte
 * equivalence with the Python renderer is enforced by `tests/render.test.ts`
 * (modulo intentionally-random fields: `deploymentId`, `gatewayToken`,
 * `welcomeAtIso`, and `vmHostname`, all of which the caller can pin via
 * RenderConfig for testing).
 *
 * The deploy template at `../deploys/byo/templates/` is the canonical
 * source — this renderer does not modify it.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

import type { RenderConfig, RenderResult } from "./types";

function resolveTemplatesDir(): string {
  if (process.env.SECRET_CLAW_TEMPLATES_DIR) {
    return path.resolve(process.env.SECRET_CLAW_TEMPLATES_DIR);
  }
  // wizard/templates/ is populated by scripts/copy-templates.mjs at prebuild
  // time. On Vercel / Cloudflare Pages / any host whose build context is
  // wizard/-only, this is where the templates live. Falls back to the
  // canonical ../deploys/byo/templates/ for local dev when prebuild hasn't
  // run, matching where the Python renderer reads from.
  const local = path.resolve(process.cwd(), "templates");
  if (fs.existsSync(local)) return local;
  return path.resolve(process.cwd(), "..", "deploys", "byo", "templates");
}

const TEMPLATES_DIR = resolveTemplatesDir();

const HOSTNAME_RE = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,253}\.)+[a-zA-Z]{2,}$/;
const HOSTNAME_WILDCARD_RE = /^\*\.([a-zA-Z0-9\-]+\.)+[a-zA-Z]{2,}$/;
const TELEGRAM_CHAT_ID_RE = /^-?\d+$/;
const UNSUBSTITUTED_TOKEN_RE = /__[A-Z][A-Z0-9_]+__/g;

const YAML_BLOCK_INDENT = 6;
const B64_WRAP_COLS = 76;

// When the caller doesn't know the assigned VM hostname yet (the wizard's
// production submit path — the SecretAI portal returns the hostname only
// after vm/create), we put this sentinel into the rendered openclaw.json
// `controlUi.allowedOrigins`. The seed script in
// `deploys/byo/templates/docker-compose.yml` `sed`-replaces the sentinel
// with $VM_HOSTNAME (from usr/.env, populated by the SecretVM platform)
// on first boot, before the gateway starts.
//
// OpenClaw's controlUi rejects wildcard patterns ("Use full origins such
// as http://localhost:5173, not wildcard patterns"), so we cannot just
// inline `*.vm.scrtlabs.com`. The runtime substitution is the only path
// that produces a literal origin matching the assigned hostname.
//
// Hyphens (not underscores) between words are deliberate — they keep the
// sentinel from matching the renderer's `__[A-Z][A-Z0-9_]+__` regex for
// "unsubstituted tokens remain". Without hyphens, the renderer would bail
// when it encountered the sentinel literally in the docker-compose.yml
// seed script (where the sed command lives).
const RUNTIME_HOSTNAME_SENTINEL = "__RUNTIME-VM-HOSTNAME__";
const DEFAULT_VM_HOSTNAME = RUNTIME_HOSTNAME_SENTINEL;

function readTemplate(...parts: string[]): string {
  return fs.readFileSync(path.join(TEMPLATES_DIR, ...parts), "utf-8");
}

function renderStr(template: string, replacements: Record<string, string>): string {
  let out = template;
  for (const [key, value] of Object.entries(replacements)) {
    out = out.split(`__${key}__`).join(value);
  }
  const remaining = out.match(UNSUBSTITUTED_TOKEN_RE);
  if (remaining && remaining.length > 0) {
    const unique = Array.from(new Set(remaining)).sort();
    throw new Error(`render.ts: unsubstituted tokens remain in rendered output: ${JSON.stringify(unique)}`);
  }
  return out;
}

function deriveWelcomeAtIso(): string {
  // Anchor at 2026-01-01T00:01:00Z so cron catches it up on first boot.
  return "2026-01-01T00:01:00Z";
}

function isValidHostname(host: string): boolean {
  return (
    host === RUNTIME_HOSTNAME_SENTINEL ||
    HOSTNAME_RE.test(host) ||
    HOSTNAME_WILDCARD_RE.test(host)
  );
}

function b64ForYamlBlock(body: string): string {
  const encoded = Buffer.from(body, "utf-8").toString("base64");
  if (encoded.length === 0) return "";
  const lines: string[] = [];
  for (let i = 0; i < encoded.length; i += B64_WRAP_COLS) {
    lines.push(encoded.slice(i, i + B64_WRAP_COLS));
  }
  const pad = " ".repeat(YAML_BLOCK_INDENT);
  const head = lines[0]!;
  if (lines.length === 1) return head;
  const tail = lines.slice(1).map((l) => pad + l).join("\n");
  return head + "\n" + tail;
}

/**
 * Match Python's `json.dumps(data, indent=2, ensure_ascii=False) + "\n"`.
 * JSON.stringify(data, null, 2) produces the same output for the inputs we
 * care about (objects, arrays, strings, numbers, booleans, null) because
 * both runtimes use insertion-order key iteration.
 */
function stringifyJson(value: unknown): string {
  return JSON.stringify(value, null, 2) + "\n";
}

function renderOpenclawJson(opts: {
  vmHostname: string;
  anthropicApiKey: string;
  telegramBotToken: string;
  telegramChatId: string;
  gatewayToken: string;
  telegramEnabled: boolean;
}): string {
  const tmpl = readTemplate("openclaw.json");
  const intermediate = renderStr(tmpl, {
    VM_HOSTNAME: opts.vmHostname,
    ANTHROPIC_API_KEY: opts.anthropicApiKey,
    TELEGRAM_BOT_TOKEN: opts.telegramBotToken || "DISABLED",
    TELEGRAM_CHAT_ID: opts.telegramChatId || "0",
    GATEWAY_TOKEN: opts.gatewayToken,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = JSON.parse(intermediate);
  if (!opts.telegramEnabled) {
    if (data.plugins && data.plugins.entries) {
      delete data.plugins.entries.telegram;
    }
    if (data.channels) {
      delete data.channels.telegram;
      if (Object.keys(data.channels).length === 0) {
        delete data.channels;
      }
    }
    if (!data.commands) data.commands = {};
    data.commands.ownerAllowFrom = [];
  }

  return stringifyJson(data);
}

function renderCronJobs(opts: {
  telegramChatId: string;
  welcomeAtIso: string;
  telegramEnabled: boolean;
}): string {
  const tmpl = readTemplate("cron-jobs.json");
  const intermediate = renderStr(tmpl, {
    TELEGRAM_CHAT_ID: opts.telegramChatId || "0",
    WELCOME_AT_ISO: opts.welcomeAtIso,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = JSON.parse(intermediate);

  if (!opts.telegramEnabled) {
    for (const job of data.jobs ?? []) {
      job.enabled = false;
    }
  }

  return stringifyJson(data);
}

function renderWorkspace(opts: {
  telegramChatId: string;
  telegramEnabled: boolean;
}): Record<string, string> {
  const telegramStatus = opts.telegramEnabled
    ? "Telegram IS configured -- use it."
    : "Telegram is NOT configured -- web UI only.";
  const telegramChat = opts.telegramEnabled ? opts.telegramChatId : "(not configured)";

  const subs = {
    TELEGRAM_STATUS: telegramStatus,
    TELEGRAM_CHAT_ID: telegramChat,
  };

  const out: Record<string, string> = {};
  for (const name of ["AGENTS.md", "IDENTITY.md", "SOUL.md", "USER.md"]) {
    const tmpl = readTemplate("workspace", name);
    out[name] = renderStr(tmpl, subs);
  }
  return out;
}

function renderCompose(opts: {
  deploymentId: string;
  openclawJson: string;
  cronJobs: string;
  workspace: Record<string, string>;
}): string {
  const tmpl = readTemplate("docker-compose.yml");
  return renderStr(tmpl, {
    DEPLOYMENT_ID: opts.deploymentId,
    DEPLOYMENT_ID_SHORT: opts.deploymentId.split("-")[0]!,
    OPENCLAW_JSON_B64: b64ForYamlBlock(opts.openclawJson),
    CRON_JOBS_B64: b64ForYamlBlock(opts.cronJobs),
    AGENTS_MD_B64: b64ForYamlBlock(opts.workspace["AGENTS.md"]!),
    IDENTITY_MD_B64: b64ForYamlBlock(opts.workspace["IDENTITY.md"]!),
    SOUL_MD_B64: b64ForYamlBlock(opts.workspace["SOUL.md"]!),
    USER_MD_B64: b64ForYamlBlock(opts.workspace["USER.md"]!),
  });
}

/**
 * Render the deploy package.
 *
 * Throws if required inputs are missing or malformed. Returns the rendered
 * compose along with the auxiliary files (for tests and observability) and
 * the generated deployment_id + gateway_token.
 */
export function render(config: RenderConfig): RenderResult {
  if (!config.anthropicApiKey) {
    throw new Error("render.ts: anthropicApiKey is required");
  }
  if (!config.anthropicApiKey.startsWith("sk-ant-")) {
    throw new Error("render.ts: anthropicApiKey should start with 'sk-ant-'");
  }

  const vmHostname = (config.vmHostname || DEFAULT_VM_HOSTNAME).trim();
  if (!isValidHostname(vmHostname)) {
    throw new Error(`render.ts: vmHostname ${JSON.stringify(vmHostname)} does not look like a DNS hostname or *.suffix wildcard`);
  }

  const tgToken = (config.telegramBotToken || "").trim();
  const tgChat = (config.telegramChatId || "").trim();

  let telegramEnabled = false;
  if (tgToken || tgChat) {
    if (!tgToken || !tgChat) {
      throw new Error("render.ts: telegramBotToken and telegramChatId must be both set or both empty");
    }
    if (!tgToken.includes(":")) {
      throw new Error("render.ts: telegramBotToken should be in the form <bot_id>:<secret>");
    }
    if (!TELEGRAM_CHAT_ID_RE.test(tgChat)) {
      throw new Error("render.ts: telegramChatId must be a signed integer string");
    }
    telegramEnabled = true;
  }

  const deploymentId = (config.deploymentId || crypto.randomUUID()).trim();
  const gatewayToken = (config.gatewayToken || crypto.randomBytes(32).toString("hex")).trim();
  const welcomeAtIso = config.welcomeAtIso || deriveWelcomeAtIso();

  const openclawJson = renderOpenclawJson({
    vmHostname,
    anthropicApiKey: config.anthropicApiKey,
    telegramBotToken: tgToken,
    telegramChatId: tgChat,
    gatewayToken,
    telegramEnabled,
  });

  const cronJobsJson = renderCronJobs({
    telegramChatId: tgChat,
    welcomeAtIso,
    telegramEnabled,
  });

  const workspace = renderWorkspace({
    telegramChatId: tgChat,
    telegramEnabled,
  });

  const compose = renderCompose({
    deploymentId,
    openclawJson,
    cronJobs: cronJobsJson,
    workspace,
  });

  return {
    compose,
    openclawJson,
    cronJobsJson,
    workspace,
    deploymentId,
    gatewayToken,
    telegramEnabled,
  };
}
