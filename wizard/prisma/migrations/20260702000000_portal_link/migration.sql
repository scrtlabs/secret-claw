-- CreateTable
CREATE TABLE "PortalLink" (
    "id" TEXT NOT NULL,
    "userSub" TEXT NOT NULL,
    "email" TEXT,
    "apiKeyCipher" TEXT NOT NULL,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortalLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PortalLink_userSub_key" ON "PortalLink"("userSub");
