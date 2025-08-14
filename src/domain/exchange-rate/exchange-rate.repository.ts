import { prisma } from "@/lib/prisma";
import { BaseRepository } from "@/domain/common/base.repository";

export class ExchangeRateRepositoryPrisma extends BaseRepository<typeof prisma.exchangeRate> {
  constructor() {
    super(prisma.exchangeRate);
  }

  async listAll() {
    return prisma.exchangeRate.findMany({
      include: {
        buyCoin: true,
        buyNetwork: true,
        payCoin: true,
        payNetwork: true
      },
      orderBy: { createdAt: "desc" }
    });
  }

  async createExchangeRate(data: {
    buyCoinId: string;
    buyNetworkId: string;
    payCoinId: string;
    payNetworkId: string;
    rate: number;
    updatedBy?: string;
  }) {
    const exists = await prisma.exchangeRate.findFirst({
      where: {
        buyCoinId: data.buyCoinId,
        buyNetworkId: data.buyNetworkId,
        payCoinId: data.payCoinId,
        payNetworkId: data.payNetworkId
      }
    });
    if (exists) throw new Error("Exchange rate ini sudah ada");

    return prisma.exchangeRate.create({ data });
  }

  async updateExchangeRate(id: string, data: Partial<{ rate: number; updatedBy?: string }>) {
    return prisma.exchangeRate.update({ where: { id }, data });
  }

  async deleteExchangeRate(id: string) {
    return prisma.exchangeRate.delete({ where: { id } });
  }
}
