-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "deploymentId" TEXT NOT NULL,
    "userSub" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "runtime" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "secretaiModel" TEXT,
    "vmId" TEXT,
    "vmHostname" TEXT,
    "jobId" TEXT,
    "gatewayToken" TEXT,
    "telegramEnabled" BOOLEAN NOT NULL DEFAULT false,
    "telegramBotUsername" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "provisionedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Agent_deploymentId_key" ON "Agent"("deploymentId");

-- CreateIndex
CREATE INDEX "Agent_userSub_idx" ON "Agent"("userSub");

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_userSub_fkey" FOREIGN KEY ("userSub") REFERENCES "User"("sub") ON DELETE RESTRICT ON UPDATE CASCADE;
