-- CreateTable
CREATE TABLE "Nuc" (
    "id" TEXT NOT NULL,
    "farmId" TEXT,
    "name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'offline',
    "lastHeartbeat" TIMESTAMP(3),
    "agentVersion" TEXT,
    "endpoint" TEXT,
    "claimCodeHash" TEXT,
    "claimCodeExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Nuc_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Nuc_farmId_idx" ON "Nuc"("farmId");

-- AddForeignKey
ALTER TABLE "Nuc" ADD CONSTRAINT "Nuc_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE SET NULL ON UPDATE CASCADE;
