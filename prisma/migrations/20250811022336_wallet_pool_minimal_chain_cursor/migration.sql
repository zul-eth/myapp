/*
  Warnings:

  - You are about to drop the `WalletPool` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "WalletPool" DROP CONSTRAINT "WalletPool_coinId_fkey";

-- DropForeignKey
ALTER TABLE "WalletPool" DROP CONSTRAINT "WalletPool_networkId_fkey";

-- DropTable
DROP TABLE "WalletPool";

-- CreateTable
CREATE TABLE "HdCursor" (
    "id" TEXT NOT NULL,
    "chain" TEXT NOT NULL,
    "nextIndex" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HdCursor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletPoolLegacy" (
    "id" TEXT NOT NULL,
    "chain" TEXT NOT NULL,
    "derivationIndex" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT true,
    "assignedOrder" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletPoolLegacy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HdCursor_chain_key" ON "HdCursor"("chain");

-- CreateIndex
CREATE UNIQUE INDEX "WalletPoolLegacy_address_key" ON "WalletPoolLegacy"("address");

-- CreateIndex
CREATE UNIQUE INDEX "WalletPoolLegacy_assignedOrder_key" ON "WalletPoolLegacy"("assignedOrder");

-- CreateIndex
CREATE UNIQUE INDEX "WalletPoolLegacy_chain_derivationIndex_key" ON "WalletPoolLegacy"("chain", "derivationIndex");
