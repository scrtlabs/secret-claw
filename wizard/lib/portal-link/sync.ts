import { portalBaseUrl } from "@/lib/portal-client";
import { portalLinkEnabled, portalSyncSecret } from "./config";
import { savePortalLink } from "./store";

const dev = process.env.NODE_ENV === "development";

export async function syncPortalAccount(opts: {
  userSub: string;
  email: string;
}): Promise<void> {
  if (!portalLinkEnabled()) {
    if (dev) console.warn("[portal-sync] skipped — PORTAL_LINK_ENCRYPTION_KEY or PORTAL_SYNC_SECRET not set");
    return;
  }
  if (!opts.userSub || !opts.email) {
    if (dev) console.warn("[portal-sync] skipped — missing userSub or email", opts);
    return;
  }

  const secret = portalSyncSecret();

  let body: { apiKey?: string; balance?: number };
  try {
    const res = await fetch(`${portalBaseUrl()}/api/auth/wizard-sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: opts.email, secret }),
      signal: AbortSignal.timeout(8000),
    });
    if (res.status === 501) {
      if (dev) console.warn("[portal-sync] portal: WIZARD_SYNC_SECRET not configured on server");
      return;
    }
    if (res.status === 404) {
      if (dev) console.warn("[portal-sync] portal: no account or default API key for", opts.email);
      return;
    }
    if (res.status === 403) {
      if (dev) console.error("[portal-sync] portal: secret mismatch — check PORTAL_SYNC_SECRET vs WIZARD_SYNC_SECRET");
      return;
    }
    if (!res.ok) {
      if (dev) console.error("[portal-sync] portal returned", res.status, await res.text().catch(() => ""));
      return;
    }
    body = (await res.json()) as typeof body;
  } catch (e) {
    if (dev) console.error("[portal-sync] fetch failed:", e);
    return;
  }

  if (!body.apiKey) {
    if (dev) console.warn("[portal-sync] portal returned no apiKey");
    return;
  }

  try {
    await savePortalLink({
      userSub: opts.userSub,
      email: opts.email,
      apiKey: body.apiKey,
      balance: body.balance ?? 0,
    });
    if (dev) console.log("[portal-sync] linked", opts.email, "→ userSub", opts.userSub);
  } catch (e) {
    if (dev) console.error("[portal-sync] DB save failed:", e);
  }
}
