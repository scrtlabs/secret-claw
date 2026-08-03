-- AlterTable
ALTER TABLE "User" ADD COLUMN "admin" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Promocode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "durationDays" INTEGER NOT NULL DEFAULT 30,
    "maxRedemptions" INTEGER,
    "redeemedCount" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promocode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoRedemption" (
    "id" TEXT NOT NULL,
    "promocodeId" TEXT NOT NULL,
    "userSub" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromoRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Promocode_code_key" ON "Promocode"("code");

-- CreateIndex
CREATE INDEX "PromoRedemption_userSub_idx" ON "PromoRedemption"("userSub");

-- CreateIndex
CREATE UNIQUE INDEX "PromoRedemption_promocodeId_userSub_key" ON "PromoRedemption"("promocodeId", "userSub");

-- AddForeignKey
ALTER TABLE "PromoRedemption" ADD CONSTRAINT "PromoRedemption_promocodeId_fkey" FOREIGN KEY ("promocodeId") REFERENCES "Promocode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
