#!/usr/bin/env tsx
/**
 * Render a deploy compose YAML without submitting to the portal.
 *
 * Reads a JSON RenderConfig from argv[2] (single arg) or stdin (if argv[2]
 * is missing), writes the rendered docker-compose.yml to stdout. Use to
 * produce a deployable compose for manual portal upload — debug deploys
 * with SSH access, etc.
 *
 * Usage:
 *   # As argv:
 *   npx tsx scripts/render-cli.ts '{"tier":"secret","secretaiApiKey":"sk-..."}'
 *
 *   # As stdin:
 *   npx tsx scripts/render-cli.ts <<EOF > /tmp/compose.yml
 *   {
 *     "tier": "secret",
 *     "secretaiApiKey": "...",
 *     "telegramBotToken": "...",
 *     "telegramChatId": "..."
 *   }
 *   EOF
 *
 * Required fields by tier:
 *   - "byo":    anthropicApiKey (sk-ant-...)
 *   - "secret": secretaiApiKey
 *
 * Optional fields (any tier): telegramBotToken + telegramChatId,
 * vmHostname (defaults to runtime sentinel), deploymentId, gatewayToken.
 */

import { render } from "../lib/render";
import type { RenderConfig } from "../lib/types";

async function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
}

async function main(): Promise<void> {
  let raw: string;
  if (process.argv[2]) {
    raw = process.argv[2];
  } else {
    raw = await readStdin();
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    console.error("render-cli: empty input. Provide JSON RenderConfig via argv[2] or stdin.");
    process.exit(1);
  }

  let config: RenderConfig;
  try {
    config = JSON.parse(trimmed);
  } catch (err) {
    console.error(`render-cli: failed to parse JSON: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }

  const result = render(config);

  // Compose to stdout for piping into a file. Metadata to stderr so it
  // doesn't pollute the YAML.
  console.error(`# tier: ${result.tier}`);
  console.error(`# deploymentId: ${result.deploymentId}`);
  console.error(`# gatewayToken: ${result.gatewayToken}`);
  console.error(`# telegramEnabled: ${result.telegramEnabled}`);
  console.error(`# Paste stdout into SecretAI portal's Create New SecretVM compose field.`);
  console.error(`# Use the gatewayToken above to authenticate the OpenClaw web UI after boot.`);
  process.stdout.write(result.compose);
}

main().catch((err) => {
  console.error(`render-cli: ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
