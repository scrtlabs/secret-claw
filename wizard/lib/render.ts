/**
 * TypeScript renderer for Secret Claw deploy templates.
 *
 * Renders a docker-compose.yml string the wizard submits to the SecretAI
 * portal via `POST /api/vm/create`. Supports two tiers:
 *
 *  - "byo"    — Anthropic Claude Sonnet 4.6 inference. User brings their
 *               own Anthropic API key. Baked into openclaw.json's anthropic
 *               provider block.
 *  - "secret" — SecretAI-hosted qwen3.5-uncensored:27b inference. Uses the
 *               user's SecretAI portal API key (same key that auths the
 *               vm/create call) for both the portal auth and the OpenClaw
 *               → SecretAI inference calls.
 *
 * Template source: `../deploys/<tier>/templates/` (canonical, used by the
 * Python renderer and the local CLI workflow for BYO). The
 * `scripts/copy-templates.mjs` prebuild copies both tiers into
 * `wizard/templates/<tier>/` so platforms whose build context is wizard-
 * only (Vercel, Cloudflare) can find them.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

import type { RenderConfig, RenderResult, Runtime, Tier } from "./types";
import { DEFAULT_SECRETAI_MODEL } from "./types";

function resolveTemplatesRoot(): string {
  if (process.env.SECRET_CLAW_TEMPLATES_DIR) {
    return path.resolve(process.env.SECRET_CLAW_TEMPLATES_DIR);
  }
  // wizard/templates/ is populated by scripts/copy-templates.mjs at
  // prebuild time. On Vercel, Cloudflare Pages, or any host whose build
  // context is wizard/-only, this is where the templates live.
  const local = path.resolve(process.cwd(), "templates");
  if (fs.existsSync(local)) return local;
  // Fallback for local dev when prebuild hasn't run — read from the
  // canonical deploys/ tree two levels up.
  return path.resolve(process.cwd(), "..", "deploys");
}

const TEMPLATES_ROOT = resolveTemplatesRoot();

function runtimeTierTemplatesDir(runtime: Runtime, tier: Tier): string {
  // Two layouts supported, in priority order:
  //  - wizard/templates/<runtime>/<tier>/                 (after prebuild)
  //  - <repo>/deploys/<runtime>/<tier>/templates/         (canonical source)
  const flat = path.join(TEMPLATES_ROOT, runtime, tier);
  // Sentinel file differs per runtime: openclaw.json for OpenClaw,
  // config.yaml for Hermes. If either is present at the flat path,
  // the prebuild copy is in place.
  const sentinels = runtime === "openclaw" ? ["openclaw.json"] : ["config.yaml"];
  for (const s of sentinels) {
    if (fs.existsSync(path.join(flat, s))) return flat;
  }
  return path.join(TEMPLATES_ROOT, runtime, tier, "templates");
}

const HOSTNAME_RE = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,253}\.)+[a-zA-Z]{2,}$/;
const HOSTNAME_WILDCARD_RE = /^\*\.([a-zA-Z0-9\-]+\.)+[a-zA-Z]{2,}$/;
const TELEGRAM_CHAT_ID_RE = /^-?\d+$/;
const UNSUBSTITUTED_TOKEN_RE = /__[A-Z][A-Z0-9_]+__/g;

const YAML_BLOCK_INDENT = 6;
const B64_WRAP_COLS = 76;

// When the caller doesn't know the assigned VM hostname yet (the wizard's
// production submit path — the SecretAI portal returns the hostname only
// after vm/create), we put this sentinel into the rendered openclaw.json
// `controlUi.allowedOrigins`. The seed script `sed`-replaces it with
// $DOMAIN_NAME at first boot.
//
// Hyphens (not underscores) deliberately — keeps the sentinel from matching
// the renderer's `__[A-Z][A-Z0-9_]+__` regex for "unsubstituted tokens
// remain". Without hyphens, the renderer would bail when it sees the
// sentinel literally inside the docker-compose.yml seed script.
const RUNTIME_HOSTNAME_SENTINEL = "__RUNTIME-VM-HOSTNAME__";
const DEFAULT_VM_HOSTNAME = RUNTIME_HOSTNAME_SENTINEL;

function readTemplate(runtime: Runtime, tier: Tier, ...parts: string[]): string {
  return fs.readFileSync(path.join(runtimeTierTemplatesDir(runtime, tier), ...parts), "utf-8");
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

function stringifyJson(value: unknown): string {
  return JSON.stringify(value, null, 2) + "\n";
}

function renderOpenclawJson(opts: {
  tier: Tier;
  vmHostname: string;
  anthropicApiKey?: string;
  secretaiApiKey?: string;
  secretaiModel: string;
  telegramBotToken: string;
  telegramChatId: string;
  gatewayToken: string;
  telegramEnabled: boolean;
}): string {
  const tmpl = readTemplate("openclaw", opts.tier, "openclaw.json");
  const replacements: Record<string, string> = {
    VM_HOSTNAME: opts.vmHostname,
    TELEGRAM_BOT_TOKEN: opts.telegramBotToken || "DISABLED",
    TELEGRAM_CHAT_ID: opts.telegramChatId || "0",
    GATEWAY_TOKEN: opts.gatewayToken,
  };
  if (opts.tier === "byo") {
    replacements.ANTHROPIC_API_KEY = opts.anthropicApiKey || "";
  } else {
    replacements.SECRETAI_API_KEY = opts.secretaiApiKey || "";
    replacements.MODEL = opts.secretaiModel;
  }
  const intermediate = renderStr(tmpl, replacements);

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
  tier: Tier;
  telegramChatId: string;
  welcomeAtIso: string;
  telegramEnabled: boolean;
}): string {
  const tmpl = readTemplate("openclaw", opts.tier, "cron-jobs.json");
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
  tier: Tier;
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
    const tmpl = readTemplate("openclaw", opts.tier, "workspace", name);
    out[name] = renderStr(tmpl, subs);
  }
  return out;
}

function renderCompose(opts: {
  tier: Tier;
  deploymentId: string;
  openclawJson: string;
  cronJobs: string;
  workspace: Record<string, string>;
}): string {
  const tmpl = readTemplate("openclaw", opts.tier, "docker-compose.yml");
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

// ---------- Hermes runtime ----------

function renderHermesConfigYaml(opts: {
  tier: Tier;
  vmHostname: string;
  secretaiModel: string;
  secretaiApiKey?: string;
}): string {
  const tmpl = readTemplate("hermes", opts.tier, "config.yaml");
  const replacements: Record<string, string> = {
    VM_HOSTNAME: opts.vmHostname,
  };
  if (opts.tier === "secret") {
    replacements.MODEL = opts.secretaiModel;
    // Hermes's custom-provider env-var fallback ignores OPENAI_API_KEY
    // when base_url doesn't match openai.com — so we have to inline
    // the key in config.yaml directly. See the comment in the
    // config.yaml template for details.
    replacements.SECRETAI_API_KEY = opts.secretaiApiKey || "";
  }
  return renderStr(tmpl, replacements);
}

function renderHermesEnv(opts: {
  tier: Tier;
  anthropicApiKey?: string;
  secretaiApiKey?: string;
  telegramBotToken: string;
  telegramChatId: string;
}): string {
  const tmpl = readTemplate("hermes", opts.tier, "env");
  const replacements: Record<string, string> = {
    TELEGRAM_BOT_TOKEN: opts.telegramBotToken || "DISABLED",
    TELEGRAM_CHAT_ID: opts.telegramChatId || "0",
  };
  if (opts.tier === "byo") {
    replacements.ANTHROPIC_API_KEY = opts.anthropicApiKey || "";
  } else {
    replacements.SECRETAI_API_KEY = opts.secretaiApiKey || "";
  }
  return renderStr(tmpl, replacements);
}

function renderHermesCronJobs(opts: {
  tier: Tier;
  telegramChatId: string;
  welcomeAtIso: string;
  telegramEnabled: boolean;
}): string {
  const tmpl = readTemplate("hermes", opts.tier, "cron-jobs.json");
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

function renderHermesWorkspace(opts: {
  tier: Tier;
  telegramChatId: string;
}): Record<string, string> {
  const subs = {
    TELEGRAM_CHAT_ID: opts.telegramChatId || "(not configured)",
  };
  const out: Record<string, string> = {};
  for (const name of ["AGENTS.md", "SOUL.md", "USER.md"]) {
    const tmpl = readTemplate("hermes", opts.tier, "workspace", name);
    out[name] = renderStr(tmpl, subs);
  }
  return out;
}

function renderHermesCompose(opts: {
  tier: Tier;
  deploymentId: string;
  anthropicApiKey?: string;
  secretaiApiKey?: string;
  telegramBotToken: string;
  telegramChatId: string;
  configYaml: string;
  envFile: string;
  cronJobs: string;
  workspace: Record<string, string>;
}): string {
  const tmpl = readTemplate("hermes", opts.tier, "docker-compose.yml");
  const replacements: Record<string, string> = {
    DEPLOYMENT_ID: opts.deploymentId,
    DEPLOYMENT_ID_SHORT: opts.deploymentId.split("-")[0]!,
    TELEGRAM_BOT_TOKEN: opts.telegramBotToken || "DISABLED",
    TELEGRAM_CHAT_ID: opts.telegramChatId || "0",
    CONFIG_YAML_B64: b64ForYamlBlock(opts.configYaml),
    ENV_B64: b64ForYamlBlock(opts.envFile),
    CRON_JOBS_B64: b64ForYamlBlock(opts.cronJobs),
    AGENTS_MD_B64: b64ForYamlBlock(opts.workspace["AGENTS.md"]!),
    SOUL_MD_B64: b64ForYamlBlock(opts.workspace["SOUL.md"]!),
    USER_MD_B64: b64ForYamlBlock(opts.workspace["USER.md"]!),
  };
  if (opts.tier === "byo") {
    replacements.ANTHROPIC_API_KEY = opts.anthropicApiKey || "";
  } else {
    replacements.SECRETAI_API_KEY = opts.secretaiApiKey || "";
  }
  return renderStr(tmpl, replacements);
}

export function render(config: RenderConfig): RenderResult {
  const runtime: Runtime = config.runtime || "openclaw";
  const tier: Tier = config.tier || "byo";

  if (runtime !== "openclaw" && runtime !== "hermes") {
    throw new Error(`render.ts: unknown runtime ${JSON.stringify(runtime)}`);
  }

  if (tier === "byo") {
    if (!config.anthropicApiKey) {
      throw new Error("render.ts: anthropicApiKey is required for BYO tier");
    }
    if (!config.anthropicApiKey.startsWith("sk-ant-")) {
      throw new Error("render.ts: anthropicApiKey should start with 'sk-ant-'");
    }
  } else if (tier === "secret") {
    if (!config.secretaiApiKey) {
      throw new Error("render.ts: secretaiApiKey is required for Secret tier");
    }
  } else {
    throw new Error(`render.ts: unknown tier ${JSON.stringify(tier)}`);
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

  const secretaiModel = (config.secretaiModel || DEFAULT_SECRETAI_MODEL).trim();
  if (tier === "secret" && !/^[a-zA-Z0-9._:-]{1,64}$/.test(secretaiModel)) {
    throw new Error(
      `render.ts: secretaiModel ${JSON.stringify(secretaiModel)} has an invalid format`,
    );
  }

  if (runtime === "hermes") {
    const configYaml = renderHermesConfigYaml({
      tier,
      vmHostname,
      secretaiModel,
      secretaiApiKey: config.secretaiApiKey,
    });
    const envFile = renderHermesEnv({
      tier,
      anthropicApiKey: config.anthropicApiKey,
      secretaiApiKey: config.secretaiApiKey,
      telegramBotToken: tgToken,
      telegramChatId: tgChat,
    });
    const cronJobsJsonH = renderHermesCronJobs({
      tier,
      telegramChatId: tgChat,
      welcomeAtIso,
      telegramEnabled,
    });
    const workspaceH = renderHermesWorkspace({
      tier,
      telegramChatId: tgChat,
    });
    const composeH = renderHermesCompose({
      tier,
      deploymentId,
      anthropicApiKey: config.anthropicApiKey,
      secretaiApiKey: config.secretaiApiKey,
      telegramBotToken: tgToken,
      telegramChatId: tgChat,
      configYaml,
      envFile,
      cronJobs: cronJobsJsonH,
      workspace: workspaceH,
    });
    return {
      compose: composeH,
      // For Hermes, providerConfig is the rendered config.yaml.
      providerConfig: configYaml,
      cronJobsJson: cronJobsJsonH,
      // Include the rendered .env in the workspace map (under a non-md
      // key) so callers that dump artifacts get the full picture.
      workspace: { ...workspaceH, ".env": envFile },
      deploymentId,
      gatewayToken,
      telegramEnabled,
      runtime,
      tier,
      secretaiModel: tier === "secret" ? secretaiModel : "",
    };
  }

  const openclawJson = renderOpenclawJson({
    tier,
    vmHostname,
    anthropicApiKey: config.anthropicApiKey,
    secretaiApiKey: config.secretaiApiKey,
    secretaiModel,
    telegramBotToken: tgToken,
    telegramChatId: tgChat,
    gatewayToken,
    telegramEnabled,
  });

  const cronJobsJson = renderCronJobs({
    tier,
    telegramChatId: tgChat,
    welcomeAtIso,
    telegramEnabled,
  });

  const workspace = renderWorkspace({
    tier,
    telegramChatId: tgChat,
    telegramEnabled,
  });

  const compose = renderCompose({
    tier,
    deploymentId,
    openclawJson,
    cronJobs: cronJobsJson,
    workspace,
  });

  return {
    compose,
    providerConfig: openclawJson,
    cronJobsJson,
    workspace,
    deploymentId,
    gatewayToken,
    telegramEnabled,
    runtime,
    tier,
    secretaiModel: tier === "secret" ? secretaiModel : "",
  };
}
