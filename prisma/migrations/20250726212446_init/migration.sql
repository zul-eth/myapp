-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'WAITING_PAYMENT', 'WAITING_CONFIRMATION', 'CONFIRMED', 'COMPLETED', 'FAILED', 'EXPIRED');

-- CreateTable
CREATE TABLE "Coin" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Coin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Network" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Network_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoinNetwork" (
    "id" TEXT NOT NULL,
    "coinId" TEXT NOT NULL,
    "networkId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoinNetwork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentOption" (
    "id" TEXT NOT NULL,
    "coinId" TEXT NOT NULL,
    "networkId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletPool" (
    "id" TEXT NOT NULL,
    "coinId" TEXT NOT NULL,
    "networkId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "xpub" TEXT,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "assignedOrder" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletPool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "coinToBuyId" TEXT NOT NULL,
    "buyNetworkId" TEXT NOT NULL,
    "payWithId" TEXT NOT NULL,
    "payNetworkId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "priceRate" DOUBLE PRECISION NOT NULL,
    "receivingAddr" TEXT NOT NULL,
    "paymentAddr" TEXT NOT NULL,
    "paymentMemo" TEXT,
    "txHash" TEXT,
    "confirmations" INTEGER NOT NULL DEFAULT 0,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Coin_symbol_key" ON "Coin"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "Network_name_key" ON "Network"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CoinNetwork_coinId_networkId_key" ON "CoinNetwork"("coinId", "networkId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentOption_coinId_networkId_key" ON "PaymentOption"("coinId", "networkId");

-- CreateIndex
CREATE UNIQUE INDEX "WalletPool_address_key" ON "WalletPool"("address");

-- CreateIndex
CREATE UNIQUE INDEX "WalletPool_coinId_networkId_address_key" ON "WalletPool"("coinId", "networkId", "address");

-- AddForeignKey
ALTER TABLE "CoinNetwork" ADD CONSTRAINT "CoinNetwork_coinId_fkey" FOREIGN KEY ("coinId") REFERENCES "Coin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoinNetwork" ADD CONSTRAINT "CoinNetwork_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "Network"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentOption" ADD CONSTRAINT "PaymentOption_coinId_fkey" FOREIGN KEY ("coinId") REFERENCES "Coin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentOption" ADD CONSTRAINT "PaymentOption_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "Network"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletPool" ADD CONSTRAINT "WalletPool_coinId_fkey" FOREIGN KEY ("coinId") REFERENCES "Coin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletPool" ADD CONSTRAINT "WalletPool_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "Network"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_coinToBuyId_fkey" FOREIGN KEY ("coinToBuyId") REFERENCES "Coin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_buyNetworkId_fkey" FOREIGN KEY ("buyNetworkId") REFERENCES "Network"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_payWithId_fkey" FOREIGN KEY ("payWithId") REFERENCES "Coin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_payNetworkId_fkey" FOREIGN KEY ("payNetworkId") REFERENCES "Network"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
