/**
 * Demo mode short-circuits the wizard's outbound calls (SecretAI portal,
 * Anthropic, Telegram, OpenClaw gateway logs) so a user can click through
 * the full UI on fake data without provisioning real VMs.
 *
 * Enabled by setting `SECRET_CLAW_DEMO_MODE=1` (or "true") in the
 * environment. The local docker-compose.yml turns this on by default.
 * Production / Vercel deploys leave it unset so the wizard talks to the
 * real services.
 */

export function isDemoMode(): boolean {
  const v = (process.env.SECRET_CLAW_DEMO_MODE || "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export const DEMO_VM_HOSTNAME = "demo-agent.vm.scrtlabs.com";
export const DEMO_VM_ID = "demo-vm-00000000";
export const DEMO_BOT_USERNAME = "SecretAgentDemoBot";

/**
 * Lifecycle pacing for demo provisioning. Tuned so the user can see each
 * state transition rather than blinking past them.
 */
export const DEMO_PROVISIONING_DELAY_MS = 1500;
export const DEMO_READY_DELAY_MS = 12000;

export function demoLogLines(): string[] {
  const now = new Date();
  const t = (offset: number) => new Date(now.getTime() - offset).toISOString();
  return [
    `${t(11000)} [gateway] starting on :18789`,
    `${t(10500)} [gateway] loading openclaw.json from /home/node/.openclaw/openclaw.json`,
    `${t(10400)} [gateway] config valid; gateway.mode=local`,
    `${t(10000)} [gateway] HTTP server listening on http://0.0.0.0:18789`,
    `${t(9500)} [gateway] controlUi allowedOrigins: [http://localhost:18789, http://127.0.0.1:18789, https://${DEMO_VM_HOSTNAME}]`,
    `${t(9000)} [agents/main] Secret Agent ready`,
    `${t(8500)} [agents/routines] Secret Agent-routines ready`,
    `${t(8000)} [cron] loaded 3 jobs from /home/node/.openclaw/cron/jobs.json`,
    `${t(7800)} [cron] welcome-once scheduled (deleteAfterRun=true)`,
    `${t(7700)} [cron] morning-news scheduled (0 13 * * * UTC)`,
    `${t(7600)} [cron] evening-crypto scheduled (0 21 * * * UTC)`,
    `${t(6000)} [plugins/telegram] connected as @${DEMO_BOT_USERNAME}`,
    `${t(4500)} [cron] running welcome-once`,
    `${t(4200)} [agents/main] turn complete (input=312 tokens, output=87 tokens)`,
    `${t(4000)} [channels/telegram] sent message to chat ${"-1001234567890"} (188 chars)`,
    `${t(3800)} [cron] welcome-once delivered; deleted per deleteAfterRun`,
    `${t(2000)} [gateway] /healthz 200 (12ms)`,
    `${t(500)} [gateway] /healthz 200 (9ms)`,
  ];
}
