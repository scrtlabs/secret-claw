export type DeploymentStatus = "submitted" | "provisioning" | "ready" | "failed";

export type Tier = "byo" | "secret";

// Two deploy-runtime options. OpenClaw is the original Node-based agent
// gateway; Hermes is a Python-based agent runtime (Hermes Agent v0.14.0
// from Nous Research). Each runtime has its own deploy template tree
// under `deploys/<runtime>/<tier>/templates/`. The wizard's renderer
// dispatches on runtime to pick the right template + substitution shape.
export type Runtime = "openclaw" | "hermes";

export interface DeploymentRecord {
  deployment_id: string;
  status: DeploymentStatus;
  runtime: Runtime;
  tier: Tier;
  // Secret-tier model id; undefined for BYO.
  secretai_model?: string;
  vm_id?: string;
  vm_hostname?: string;
  // Portal's background-job id returned from vm/create. Used by the
  // deployment-status route to poll for provisioning completion
  // on-demand (each client poll triggers one portal job-status check)
  // — the fire-and-forget continuation in submit-deployment gets
  // killed by Vercel before the multi-minute portal poll completes.
  job_id?: string;
  gateway_token?: string;
  telegram_enabled: boolean;
  telegram_bot_username?: string;
  error_message?: string;
  created_at: string;
  provisioned_at?: string;
}

export interface RenderConfig {
  // Default "openclaw" when absent (backward compat with code paths that
  // didn't pass a runtime, e.g. the byte-equivalence test).
  runtime?: Runtime;
  tier?: Tier;
  vmHostname?: string;
  // BYO tier requires anthropicApiKey. Secret tier requires secretaiApiKey
  // (used for both the model provider config AND the portal vm/create
  // bearer auth — same key serves both roles in the Secret-tier flow).
  anthropicApiKey?: string;
  secretaiApiKey?: string;
  // Secret-tier model id (e.g. "gemma4:31b"). Ignored for BYO tier.
  // Defaults to the safe verified-tool-capable choice; see SECRETAI_MODELS.
  secretaiModel?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  deploymentId?: string;
  gatewayToken?: string;
  welcomeAtIso?: string;
}

// Allowed Secret-tier models on the rytn endpoint. Default first.
// gemma4:31b is the only one verified end-to-end with structured
// tool_calls; qwq and qwen3-vl are exposed for power users who want
// to experiment — see the per-runtime caveats in the wizard form.
export const SECRETAI_MODELS = [
  { id: "gemma4:31b", label: "gemma4:31b (default, tool-capable)" },
  { id: "qwq:32b", label: "qwq:32b (reasoning; experimental)" },
  { id: "qwen3-vl:32b", label: "qwen3-vl:32b (vision-language; experimental)" },
] as const;
export const DEFAULT_SECRETAI_MODEL = SECRETAI_MODELS[0].id;

export interface RenderResult {
  compose: string;
  // Provider-config payload: openclaw.json for OpenClaw runtime,
  // config.yaml for Hermes. Both are surfaced as a single string for
  // logging / dry-run inspection purposes.
  providerConfig: string;
  cronJobsJson: string;
  workspace: Record<string, string>;
  deploymentId: string;
  gatewayToken: string;
  telegramEnabled: boolean;
  runtime: Runtime;
  tier: Tier;
  // Resolved model id (e.g. "gemma4:31b") for Secret tier;
  // empty string for BYO tier.
  secretaiModel: string;
}

export interface FormSubmission {
  runtime: Runtime;
  tier: Tier;
  secretaiApiKey: string;
  // Secret-tier only; ignored for BYO.
  secretaiModel?: string;
  // Anthropic key is only required for BYO tier. Optional in the
  // FormSubmission type — the submit handler validates the tier-specific
  // requirements server-side. Either a raw key (anthropicApiKey) or a
  // reference to a saved key (anthropicKeyId) satisfies the requirement.
  anthropicApiKey?: string;
  // Id of one of the user's saved Anthropic keys. Resolved to plaintext
  // server-side so the key material never round-trips through the browser.
  anthropicKeyId?: string;
  telegramEnabled: boolean;
  telegramBotToken?: string;
  telegramChatId?: string;
  telegramBotUsername?: string;
}
