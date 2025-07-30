-- CreateTable
CREATE TABLE "ExchangeRate" (
    "id" TEXT NOT NULL,
    "buyCoinId" TEXT NOT NULL,
    "buyNetworkId" TEXT NOT NULL,
    "payCoinId" TEXT NOT NULL,
    "payNetworkId" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeRate_buyCoinId_buyNetworkId_payCoinId_payNetworkId_key" ON "ExchangeRate"("buyCoinId", "buyNetworkId", "payCoinId", "payNetworkId");

-- AddForeignKey
ALTER TABLE "ExchangeRate" ADD CONSTRAINT "ExchangeRate_buyCoinId_fkey" FOREIGN KEY ("buyCoinId") REFERENCES "Coin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExchangeRate" ADD CONSTRAINT "ExchangeRate_buyNetworkId_fkey" FOREIGN KEY ("buyNetworkId") REFERENCES "Network"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExchangeRate" ADD CONSTRAINT "ExchangeRate_payCoinId_fkey" FOREIGN KEY ("payCoinId") REFERENCES "Coin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExchangeRate" ADD CONSTRAINT "ExchangeRate_payNetworkId_fkey" FOREIGN KEY ("payNetworkId") REFERENCES "Network"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
