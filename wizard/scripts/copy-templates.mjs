#!/usr/bin/env node
/**
 * Copy the canonical deploy templates from ../deploys/byo/templates/ into
 * wizard/templates/ so `lib/render.ts` can find them when the wizard runs
 * on a platform whose build context is only the wizard/ directory
 * (Vercel, Cloudflare Pages, etc.).
 *
 * Runs as the `prebuild` and `pretest` npm hooks. Behavior:
 *  - If the source templates exist at ../deploys/byo/templates/, copy
 *    (overwrite) them into ./templates/. This is the local dev + Vercel
 *    path.
 *  - If the source doesn't exist but ./templates/ is already populated,
 *    skip silently. This handles the Docker builder stage, where the
 *    Dockerfile pre-populates ./templates from the build context's
 *    deploys/byo/ before `npm run build` fires.
 *  - If neither source exists, fail loudly.
 *
 * The copied wizard/templates/ directory is .gitignored — it's a build
 * artifact, not source. deploys/byo/templates/ remains the canonical
 * source of truth.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const SCRIPT_DIR = path.dirname(__filename);
const WIZARD_ROOT = path.resolve(SCRIPT_DIR, "..");

const SOURCE = path.resolve(WIZARD_ROOT, "..", "deploys", "byo", "templates");
const DEST = path.resolve(WIZARD_ROOT, "templates");

if (fs.existsSync(SOURCE)) {
  fs.rmSync(DEST, { recursive: true, force: true });
  fs.cpSync(SOURCE, DEST, { recursive: true });
  console.log(`[copy-templates] copied ${SOURCE} -> ${DEST}`);
} else if (fs.existsSync(DEST)) {
  console.log(`[copy-templates] source ${SOURCE} not present; using pre-populated ${DEST}`);
} else {
  console.error(`[copy-templates] ERROR: source not found at ${SOURCE} and no pre-populated ${DEST}`);
  process.exit(1);
}
