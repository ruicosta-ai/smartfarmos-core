-- CreateEnum
CREATE TYPE "IntegrationKind" AS ENUM ('WUNDERGROUND');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('DISABLED', 'PENDING', 'RUNNING', 'ERROR');

-- CreateTable
CREATE TABLE "NucIntegration" (
    "id" TEXT NOT NULL,
    "nucId" TEXT NOT NULL,
    "kind" "IntegrationKind" NOT NULL,
    "name" TEXT,
    "config" JSONB,
    "secrets" JSONB,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'DISABLED',
    "lastSync" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NucIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NucIntegration_nucId_idx" ON "NucIntegration"("nucId");

-- AddForeignKey
ALTER TABLE "NucIntegration" ADD CONSTRAINT "NucIntegration_nucId_fkey" FOREIGN KEY ("nucId") REFERENCES "Nuc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
