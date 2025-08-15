import { prisma } from "@/lib/prisma";

export class ExchangeRateRepositoryPrisma {
  async listAll() {
    return prisma.exchangeRate.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        buyCoin: true,
        buyNetwork: true,
        payCoin: true,
        payNetwork: true,
      },
    });
  }

  async findById(id: string) {
    return prisma.exchangeRate.findUnique({
      where: { id },
      include: {
        buyCoin: true,
        buyNetwork: true,
        payCoin: true,
        payNetwork: true,
      },
    });
  }

  async findLatestByComposite(params: {
    buyCoinId: string;
    buyNetworkId: string;
    payCoinId: string;
    payNetworkId: string;
  }) {
    const { buyCoinId, buyNetworkId, payCoinId, payNetworkId } = params;
    return prisma.exchangeRate.findFirst({
      where: { buyCoinId, buyNetworkId, payCoinId, payNetworkId },
      orderBy: { createdAt: "desc" },
      include: {
        buyCoin: true,
        buyNetwork: true,
        payCoin: true,
        payNetwork: true,
      },
    });
  }

  async createExchangeRate(data: any) {
    return prisma.exchangeRate.create({ data });
  }

  async updateExchangeRate(id: string, data: any) {
    return prisma.exchangeRate.update({ where: { id }, data });
  }

  async deleteExchangeRate(id: string) {
    return prisma.exchangeRate.delete({ where: { id } });
  }
}
