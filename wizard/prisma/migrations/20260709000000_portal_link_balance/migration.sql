-- AlterTable: add balance column to PortalLink (silent sync stores portal balance at link time)
ALTER TABLE "PortalLink" ADD COLUMN "balance" DOUBLE PRECISION NOT NULL DEFAULT 0;
