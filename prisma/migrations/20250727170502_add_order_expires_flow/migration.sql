/*
  Warnings:

  - You are about to drop the column `expiredAt` on the `ExchangeRate` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ExchangeRate" DROP COLUMN "expiredAt";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "expiresAt" TIMESTAMP(3);
