import { getSessionUser, type SessionUser } from "./session";
import { prisma } from "../db/prisma";

/** True when the user identified by `sub` has the admin flag set. */
export async function isUserAdmin(sub: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { sub },
    select: { admin: true },
  });
  return user?.admin === true;
}

/**
 * The signed-in user if they're an admin, otherwise null. Route handlers use
 * this to gate admin-only endpoints — treat null as a 403/401.
 */
export async function requireAdmin(): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user) return null;
  return (await isUserAdmin(user.sub)) ? user : null;
}
