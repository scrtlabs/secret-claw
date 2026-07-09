/**
 * Configuration for the portal account-link silent sync.
 */

export function portalLinkEnabled(): boolean {
  return !!(process.env.PORTAL_LINK_ENCRYPTION_KEY && process.env.PORTAL_SYNC_SECRET);
}

export function portalSyncSecret(): string {
  return process.env.PORTAL_SYNC_SECRET?.trim() ?? "";
}
