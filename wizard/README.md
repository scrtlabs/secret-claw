# Secret Claw wizard (Chunk 3)

Next.js (App Router) wizard that lets a user deploy their own AI agent on
SecretVM via the SecretAI portal API. Implements the Chunk 3 product
surface from `../docs/secret-claw-v1-build-plan.md` (v0.8) and the design
sketched in `../docs/wizard-design.md` (v0.3).

Two views:

- `/create-agent` — single-page configuration form with five sections
  (Tier / SecretAI key / Anthropic key / Telegram / Submit)
- `/agents/<deployment_id>` — agent detail page with Overview + Logs tabs

## Running locally

```powershell
cd C:\dev\secret-claw\wizard
npm install
copy .env.local.example .env.local
npm run dev
```

Open `http://localhost:3000/`. The root path redirects to `/create-agent`.

## Running locally with Docker (production-like, demo mode)

A `Dockerfile` + `docker-compose.yml` ship in this directory. The image
is a Next.js standalone build (`output: 'standalone'`) with the deploy
templates bundled inside at `/app/templates`.

```powershell
cd C:\dev\secret-claw\wizard
docker compose build
docker compose up
# open http://localhost:3001/   (host port 3001 → container 3000)
# Ctrl+C, then:
docker compose down
```

**Demo mode is ON by default in this compose file.** That means:

- Any non-empty input to the SecretAI key, Anthropic key, and Telegram
  bot/chat fields validates as `Valid ✓`. Paste literally anything (a
  single character works) to satisfy each section.
- Clicking **Create** does NOT submit to the real SecretAI portal. It
  records the deployment locally and drives it through the lifecycle
  states on timers: `submitted → provisioning (after 1.5s) → ready
  (after 12s)`. The detail page polls every 3 seconds, so you see each
  state transition as it would in production.
- The Ready state shows a fake `vm_hostname` of
  `demo-agent.vm.scrtlabs.com`, a fake gateway token (the real
  click-to-reveal + copy still works), and `@SecretAgentDemoBot` for
  Telegram (if you enabled it).
- The Logs tab returns ~18 lines of synthetic gateway logs so you can
  see the layout.

To exercise the real submission path (against the actual SecretAI
portal, with real credentials), set the env var before `docker compose
up`:

```powershell
$env:SECRET_CLAW_DEMO_MODE=0; docker compose up
```

Or put `SECRET_CLAW_DEMO_MODE=0` in a `.env` file next to `docker-compose.yml`.

Why host port 3001 instead of 3000? A leftover Docker port reservation
on the dev host holds 3000. Change to `"3000:3000"` in
`docker-compose.yml` if your host has it free.

The container includes the deploy templates baked in. `lib/render.ts`
reads `SECRET_CLAW_TEMPLATES_DIR=/app/templates` (set in the Dockerfile)
so it resolves them correctly without needing the source tree mounted.

### Why no `waitUntil` in the submit handler

`app/api/portal/submit-deployment/route.ts` does not import Vercel's
`waitUntil`. In a long-running Node server (which is what a Docker
container running `node server.js` produces), the Node process is
already long-lived; we just need to kick off the slow portal work as a
non-awaited promise after returning the synchronous response. The
function wraps its body in try/catch and persists any failure on the
deployment record so a rejection cannot crash the worker. On Vercel,
the equivalent pattern is `waitUntil(...)` from `@vercel/functions` —
switching back is a one-line change.

## Build, type-check, test

```powershell
npm run build       # production build (Next.js)
npm run typecheck   # tsc --noEmit
npm test            # runs tests/*.test.ts including the render byte-equivalence test
```

The render byte-equivalence test (`tests/render.test.ts`) shells out to
`../deploys/byo/scripts/render.py` with a fixed config and fixed random
values, runs `lib/render.ts` with the same inputs, and asserts the
generated `docker-compose.yml`, `openclaw.rendered.json`,
`cron-jobs.rendered.json`, and four workspace markdown files are byte
identical. Python 3.10+ on PATH is required.

## What's in here

| Path                                | Purpose                                                                 |
|-------------------------------------|-------------------------------------------------------------------------|
| `Dockerfile`                        | Multi-stage build → Next.js standalone image with templates bundled    |
| `docker-compose.yml`                | Local-test wiring (host port 3001 → container 3000)                    |
| `.dockerignore`                     | Keeps the build context small                                          |

(continued)

| Path                                | Purpose                                                                 |
|-------------------------------------|-------------------------------------------------------------------------|
| `app/create-agent/page.tsx`         | The single-page configuration form                                      |
| `app/agents/[deployment_id]/page.tsx` | Agent detail page (Overview + Logs)                                   |
| `app/api/portal/validate-secretai-key/route.ts` | Proxy → `GET /api/vm/instances` (key validation)            |
| `app/api/portal/submit-deployment/route.ts` | Submission endpoint (sync record + fire-and-forget continuation) |
| `app/api/deployment-status/[deployment_id]/route.ts` | Status read for detail-page polling                    |
| `app/api/validate-anthropic-key/route.ts` | Anthropic key validation (test one-token call)                    |
| `app/api/validate-telegram/route.ts` | Telegram bot-token validation (`getMe`)                                |
| `components/*`                      | Portal-style component primitives (Position A visual language)         |
| `lib/render.ts`                     | TypeScript port of `../deploys/byo/scripts/render.py`                  |
| `lib/portal-client.ts`              | Helpers for talking to the SecretAI portal server-side                 |
| `lib/db.ts`                         | In-memory deployment record store (Chunk 4 swaps for Supabase)         |
| `lib/types.ts`                      | Shared TypeScript types                                                |
| `tests/render.test.ts`              | Byte-equivalence test against the Python renderer                      |

## Manual end-to-end test (when ready to submit to the live portal)

The build is not wired to the real portal during local dev by default —
the `submit-deployment` handler does call the portal when given a real
API key. To run an end-to-end test:

1. Generate a real SecretAI API key (https://secretai.scrtlabs.com → API keys).
2. Generate a real Anthropic API key.
3. Optionally generate a real Telegram bot token + chat ID via BotFather.
4. `npm run dev` (or `docker compose up`), open `http://localhost:3000/create-agent`
   (or `http://localhost:3001/create-agent` if running via Docker).
5. Paste the SecretAI key into Section 2; tab out. The "Validating…" pill
   should flip to "Valid".
6. Paste the Anthropic key into Section 3; tab out. Same flip.
7. Enable Telegram if you have credentials, paste them; tab out.
   ("Skip" works too.)
8. Click **Create**. Watch the browser navigate to `/agents/<deployment_id>`.
9. The Overview tab should show the deployment ID, the agent name
   (Secret Agent), tier (BYO), Telegram flag, creation time, and a
   status pill ("Submitted" → "Provisioning"). Polling fires every 3s.
10. When status flips to "Ready", the page should render the agent URL,
    gateway token (click-to-reveal + copy), and Telegram bot username
    (if applicable).
11. Click the Logs tab. It fetches the latest log lines from the
    gateway endpoint on activation; manual refresh button available.

## Known gaps / decisions made during Chunk 3 build

- **VM_HOSTNAME ambiguity.** `render.py` requires VM_HOSTNAME at render
  time. The portal returns the hostname only *after* `vm/create`. The
  wizard form has no hostname input by design. `lib/render.ts` accepts
  an optional `vmHostname`; when omitted (the production submit path) it
  burns the wildcard `*.vm.scrtlabs.com` into
  `controlUi.allowedOrigins`. The byte-equivalence test passes a
  concrete hostname so the Python comparison is meaningful. Flagged for
  follow-up — confirm the wildcard is accepted by OpenClaw's control UI
  origin check, or move the hostname substitution to seed-script-time
  using `vmDomain` from `usr/.env`.
- **Logs tab endpoint.** The OpenClaw gateway log path is not
  documented in FINDINGS.md. The Logs view fetches via a placeholder
  endpoint (`https://<vm_hostname>/_logs?n=200`) and gracefully shows
  "Logs unavailable" when the call fails. Real endpoint should be
  wired in once we confirm OpenClaw's log surface — flagged in the
  design doc's Logs tab open questions.
- **In-memory deployment record store.** Chunk 4 will replace this
  with Supabase. The `Db` interface in `lib/db.ts` is the swap point.
  In-memory state is lost on dev-server restart and on container
  restart (no host volume mounted).
- **Async portal handler runs as a fire-and-forget promise** (not
  Vercel `waitUntil`). The Node process inside the container is
  long-running so this is the correct shape; see the dedicated section
  above for the Vercel switch-back path if/when that decision reverses.
- **Anthropic Sonnet 4.6 access detection.** Anthropic validation
  does a single one-token call; the model ID is read from the rendered
  template. We do not separately probe whether the key has Sonnet 4.6
  access — if it doesn't, the agent surfaces the error at first
  inference rather than at form validation. Matches the simpler
  option in design doc Section 3 question 5.

## Files NOT to touch

`../deploys/byo/` is the canonical deploy template — `lib/render.ts` is
a faithful Node port, not a modification. The Python renderer
`../deploys/byo/scripts/render.py` is the source of truth; the byte
test enforces equivalence.
