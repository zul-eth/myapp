/*
  Warnings:

  - You are about to drop the column `assignedOrder` on the `WalletPoolLegacy` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[assignedOrderId]` on the table `WalletPoolLegacy` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."WalletPoolLegacy_assignedOrder_key";

-- AlterTable
ALTER TABLE "public"."HdCursor" ADD COLUMN     "lastUsedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."WalletPoolLegacy" DROP COLUMN "assignedOrder",
ADD COLUMN     "assignedOrderId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "isUsed" SET DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "WalletPoolLegacy_assignedOrderId_key" ON "public"."WalletPoolLegacy"("assignedOrderId");

-- AddForeignKey
ALTER TABLE "public"."WalletPoolLegacy" ADD CONSTRAINT "WalletPoolLegacy_assignedOrderId_fkey" FOREIGN KEY ("assignedOrderId") REFERENCES "public"."Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
