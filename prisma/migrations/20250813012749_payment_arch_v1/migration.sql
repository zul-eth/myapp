-- CreateEnum
CREATE TYPE "public"."ChainFamily" AS ENUM ('EVM', 'TRON', 'SOLANA', 'EOS', 'XRP', 'DOGE', 'SUI', 'LTC', 'TON');

-- CreateEnum
CREATE TYPE "public"."AssetType" AS ENUM ('NATIVE', 'EVM_ERC20', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."MemoKind" AS ENUM ('NONE', 'XRP_TAG', 'EOS_TEXT', 'TON_TEXT', 'OTHER');

-- AlterTable
ALTER TABLE "public"."CoinNetwork" ADD COLUMN     "assetType" "public"."AssetType" NOT NULL DEFAULT 'NATIVE',
ADD COLUMN     "contractAddress" VARCHAR(128),
ADD COLUMN     "decimals" INTEGER DEFAULT 18,
ADD COLUMN     "memoKind" "public"."MemoKind" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "memoLabel" TEXT,
ADD COLUMN     "memoRegex" TEXT,
ADD COLUMN     "symbolOverride" TEXT;

-- AlterTable
ALTER TABLE "public"."Network" ADD COLUMN     "chainId" TEXT,
ADD COLUMN     "explorer" TEXT,
ADD COLUMN     "family" "public"."ChainFamily" NOT NULL DEFAULT 'EVM',
ADD COLUMN     "rpcUrl" TEXT,
ADD COLUMN     "symbol" TEXT;

-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "receivingMemo" TEXT;

-- CreateIndex
CREATE INDEX "CoinNetwork_networkId_contractAddress_idx" ON "public"."CoinNetwork"("networkId", "contractAddress");
