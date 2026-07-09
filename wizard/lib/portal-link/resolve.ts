import { getSessionUser } from "@/lib/auth/session";
import { portalLinkEnabled } from "./config";
import { getLinkedPortalApiKey } from "./store";

export async function resolvePortalApiKey(explicitKey?: string): Promise<string | null> {
  if (explicitKey) return explicitKey;
  if (!portalLinkEnabled()) return null;
  const user = await getSessionUser();
  if (!user) return null;
  try {
    return await getLinkedPortalApiKey(user.sub);
  } catch {
    return null;
  }
}
