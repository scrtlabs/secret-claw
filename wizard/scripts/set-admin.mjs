#!/usr/bin/env node
/**
 * Grant (or revoke) admin on a user by email. There is no UI to bootstrap the
 * first admin, so run this once against your DB:
 *
 *   node scripts/set-admin.mjs you@example.com          # grant
 *   node scripts/set-admin.mjs you@example.com --off     # revoke
 *
 * Requires DATABASE_URL to be set in the environment.
 */
import { PrismaClient } from "@prisma/client";

const email = process.argv[2];
const revoke = process.argv.includes("--off");

if (!email) {
  console.error("Usage: node scripts/set-admin.mjs <email> [--off]");
  process.exit(1);
}

const prisma = new PrismaClient();
try {
  const user = await prisma.user.update({
    where: { email },
    data: { admin: !revoke },
    select: { email: true, admin: true },
  });
  console.log(`${user.email} → admin=${user.admin}`);
} catch (err) {
  console.error(`Failed: ${err?.message ?? err}`);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
