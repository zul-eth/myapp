import { prisma } from "@/lib/prisma";

export class ExchangeRateRepositoryPrisma {
  async getLatest(params: { buyCoinId: string; buyNetworkId: string; payCoinId: string; payNetworkId: string }) {
    return prisma.exchangeRate.findFirst({
      where: {
        buyCoinId: params.buyCoinId,
        buyNetworkId: params.buyNetworkId,
        payCoinId: params.payCoinId,
        payNetworkId: params.payNetworkId
      },
      orderBy: { createdAt: "desc" }
    });
  }
}
