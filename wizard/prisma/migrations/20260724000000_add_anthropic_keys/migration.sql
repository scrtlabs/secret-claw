-- CreateTable
CREATE TABLE "AnthropicKey" (
    "id" TEXT NOT NULL,
    "userSub" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyCipher" TEXT NOT NULL,
    "keyHint" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnthropicKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnthropicKey_userSub_idx" ON "AnthropicKey"("userSub");

-- CreateIndex
CREATE UNIQUE INDEX "AnthropicKey_userSub_name_key" ON "AnthropicKey"("userSub", "name");
