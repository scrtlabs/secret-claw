import { portalBaseUrl } from "@/lib/portal-client";
import { portalLinkEnabled, portalSyncSecret } from "./config";
import { savePortalLink } from "./store";

export async function syncPortalAccount(opts: {
  userSub: string;
  email: string;
}): Promise<void> {
  if (!portalLinkEnabled()) return;
  const secret = portalSyncSecret();
  if (!secret || !opts.email) return;

  let body: { apiKey?: string; balance?: number };
  try {
    const res = await fetch(`${portalBaseUrl()}/api/auth/wizard-sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: opts.email, secret }),
      signal: AbortSignal.timeout(8000),
    });
    if (res.status === 404 || res.status === 501) return; // no portal account or feature disabled
    if (!res.ok) return;
    body = (await res.json()) as typeof body;
  } catch {
    return; // portal unreachable — degrade silently
  }

  if (!body.apiKey) return;

  try {
    await savePortalLink({
      userSub: opts.userSub,
      email: opts.email,
      apiKey: body.apiKey,
      balance: body.balance ?? 0,
    });
  } catch {
    // DB write failure — portal sync is best-effort
  }
}
