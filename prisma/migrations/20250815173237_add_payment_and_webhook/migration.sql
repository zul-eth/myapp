/*
  Warnings:

  - The values [UNDERPAID] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `confirmations` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `txHash` on the `Order` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('NOT_STARTED', 'DETECTED', 'UNDERPAID', 'OVERPAID', 'CONFIRMING', 'CONFIRMED', 'INVALID', 'REFUNDED');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."OrderStatus_new" AS ENUM ('PENDING', 'WAITING_PAYMENT', 'WAITING_CONFIRMATION', 'CONFIRMED', 'COMPLETED', 'EXPIRED', 'CANCELED', 'FAILED');
ALTER TABLE "public"."Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."Order" ALTER COLUMN "status" TYPE "public"."OrderStatus_new" USING ("status"::text::"public"."OrderStatus_new");
ALTER TYPE "public"."OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "public"."OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "public"."OrderStatus_old";
ALTER TABLE "public"."Order" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "public"."Network" ADD COLUMN     "explorerAddrTemplate" TEXT,
ADD COLUMN     "explorerTxTemplate" TEXT,
ADD COLUMN     "minConfirmationsHigh" INTEGER,
ADD COLUMN     "minConfirmationsLow" INTEGER,
ADD COLUMN     "requiredConfirmations" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "public"."Order" DROP COLUMN "confirmations",
DROP COLUMN "txHash";

-- AlterTable
ALTER TABLE "public"."WalletPoolLegacy" ADD COLUMN     "networkId" TEXT;

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "coinId" TEXT NOT NULL,
    "networkId" TEXT NOT NULL,
    "payToAddress" TEXT NOT NULL,
    "payToMemo" TEXT,
    "txHash" VARCHAR(128),
    "fromAddress" TEXT,
    "toAddress" TEXT,
    "amountRaw" TEXT,
    "decimals" INTEGER,
    "assetType" "public"."AssetType",
    "assetContract" VARCHAR(128),
    "confirmations" INTEGER NOT NULL DEFAULT 0,
    "requiredConfirmations" INTEGER NOT NULL DEFAULT 1,
    "detectedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "lastWebhookEventId" TEXT,
    "verificationSource" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "handled" BOOLEAN NOT NULL DEFAULT false,
    "paymentId" TEXT,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_orderId_key" ON "public"."Payment"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_lastWebhookEventId_key" ON "public"."Payment"("lastWebhookEventId");

-- CreateIndex
CREATE INDEX "Payment_networkId_txHash_idx" ON "public"."Payment"("networkId", "txHash");

-- CreateIndex
CREATE INDEX "Payment_payToAddress_idx" ON "public"."Payment"("payToAddress");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_externalId_key" ON "public"."WebhookEvent"("externalId");

-- CreateIndex
CREATE INDEX "WebhookEvent_provider_handled_idx" ON "public"."WebhookEvent"("provider", "handled");

-- CreateIndex
CREATE INDEX "CoinNetwork_memoKind_idx" ON "public"."CoinNetwork"("memoKind");

-- CreateIndex
CREATE INDEX "WalletPoolLegacy_chain_isUsed_idx" ON "public"."WalletPoolLegacy"("chain", "isUsed");

-- CreateIndex
CREATE INDEX "WalletPoolLegacy_networkId_idx" ON "public"."WalletPoolLegacy"("networkId");

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_coinId_fkey" FOREIGN KEY ("coinId") REFERENCES "public"."Coin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "public"."Network"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WebhookEvent" ADD CONSTRAINT "WebhookEvent_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
