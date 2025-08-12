/*
  Warnings:

  - A unique constraint covering the columns `[payoutHash]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "payoutAt" TIMESTAMP(3),
ADD COLUMN     "payoutHash" VARCHAR(128);

-- CreateIndex
CREATE UNIQUE INDEX "Order_payoutHash_key" ON "Order"("payoutHash");
