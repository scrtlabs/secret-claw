import { getServerSession } from "next-auth";
import { authOptions } from "./options";

export interface SessionUser {
  /** NextAuth token `sub` — stable across providers (see PortalLink model). */
  sub: string;
  email?: string;
}

/** The signed-in wizard user for a route handler, or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  const sub = (session?.user as { id?: string } | undefined)?.id;
  if (!sub) return null;
  return { sub, email: session?.user?.email ?? undefined };
}
