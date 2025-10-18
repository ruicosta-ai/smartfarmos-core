/*
  Warnings:

  - A unique constraint covering the columns `[farmId]` on the table `Nuc` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Nuc_farmId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "Nuc_farmId_key" ON "Nuc"("farmId");
