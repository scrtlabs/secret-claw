/**
 * Server-side helpers for talking to the SecretAI portal.
 *
 * The browser cannot call the portal directly — the portal serves no CORS
 * headers (FINDINGS.md §5). All portal calls happen inside `app/api/...`
 * route handlers using these helpers.
 *
 * No user credential is ever logged or persisted — bearer tokens flow
 * single-hop through these helpers.
 */

const DEFAULT_PORTAL_URL = "https://preview-aidev.scrtlabs.com";
const DEFAULT_FETCH_TIMEOUT_MS = 5000;

export function portalBaseUrl(): string {
  return process.env.SECRETAI_PORTAL_URL || DEFAULT_PORTAL_URL;
}

function timeoutSignal(ms: number): AbortSignal {
  if (typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(ms);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

export interface ValidateKeyResult {
  valid: boolean;
  status: number;
  vmCount?: number;
  latencyMs: number;
}

export async function validateSecretAiKey(apiKey: string): Promise<ValidateKeyResult> {
  const url = `${portalBaseUrl()}/api/vm/instances`;
  const started = Date.now();
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: timeoutSignal(DEFAULT_FETCH_TIMEOUT_MS),
    });
    const latencyMs = Date.now() - started;
    if (res.status === 200) {
      let vmCount: number | undefined;
      try {
        const body = (await res.json()) as unknown;
        if (Array.isArray(body)) vmCount = body.length;
      } catch {
        // body might not be JSON; status 200 alone is enough to consider valid.
      }
      return { valid: true, status: 200, vmCount, latencyMs };
    }
    return { valid: false, status: res.status, latencyMs };
  } catch (err) {
    return { valid: false, status: 0, latencyMs: Date.now() - started };
  }
}

export interface CreateVmResult {
  ok: boolean;
  status: number;
  vmId?: string;
  jobId?: string;
  vmHostname?: string;
  errorBody?: string;
}

/**
 * Submit a rendered compose to the portal's `/api/vm/create` endpoint.
 *
 * The portal expects multipart/form-data with at minimum:
 *   - name (string)
 *   - vmTypeId (string)
 *   - environment ("dev" or "prod")
 *   - dockercompose (file)
 *
 * See `docs/secretvm-provisioning-research.md` §1b for the full form
 * field set; we send the minimum.
 */
export async function createVm(opts: {
  apiKey: string;
  name: string;
  vmTypeId: string;
  environment: "dev" | "prod";
  compose: string;
  composeFilename?: string;
}): Promise<CreateVmResult> {
  const url = `${portalBaseUrl()}/api/vm/create`;
  const form = new FormData();
  form.append("name", opts.name);
  form.append("vmTypeId", opts.vmTypeId);
  form.append("environment", opts.environment);
  const composeBlob = new Blob([opts.compose], { type: "application/x-yaml" });
  form.append("dockercompose", composeBlob, opts.composeFilename || "docker-compose.yml");

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${opts.apiKey}` },
      body: form,
    });
    if (!res.ok) {
      const errorBody = await res.text().catch(() => "");
      return { ok: false, status: res.status, errorBody };
    }
    const body = (await res.json()) as { id?: string; jobId?: string; vmDomain?: string };
    return {
      ok: true,
      status: res.status,
      vmId: body.id,
      jobId: body.jobId,
      vmHostname: body.vmDomain,
    };
  } catch (err) {
    return { ok: false, status: 0, errorBody: err instanceof Error ? err.message : String(err) };
  }
}

export interface JobStatusResult {
  ok: boolean;
  status: number;
  jobStatus?: string;
  jobBody?: unknown;
}

export async function getJobStatus(opts: { apiKey: string; jobId: string }): Promise<JobStatusResult> {
  const url = `${portalBaseUrl()}/api/background-job/${encodeURIComponent(opts.jobId)}`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${opts.apiKey}` },
    });
    if (!res.ok) {
      return { ok: false, status: res.status };
    }
    const body = (await res.json()) as { status?: string };
    return { ok: true, status: res.status, jobStatus: body.status, jobBody: body };
  } catch {
    return { ok: false, status: 0 };
  }
}
