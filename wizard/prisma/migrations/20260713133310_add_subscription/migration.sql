-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userSub" TEXT NOT NULL,
    "bluesnapSubscriptionId" TEXT NOT NULL,
    "bluesnapVaultedShopperId" TEXT,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "trialEndsAt" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userSub_key" ON "Subscription"("userSub");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_bluesnapSubscriptionId_key" ON "Subscription"("bluesnapSubscriptionId");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userSub_fkey" FOREIGN KEY ("userSub") REFERENCES "User"("sub") ON DELETE RESTRICT ON UPDATE CASCADE;
