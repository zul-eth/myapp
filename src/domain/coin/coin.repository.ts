import { prisma } from "@/lib/prisma";
import { BaseRepository } from "@/domain/common/base.repository";

export class CoinRepositoryPrisma extends BaseRepository<typeof prisma.coin> {
  constructor() {
    super(prisma.coin);
  }

  async createCoin(data: { symbol: string; name: string; logoUrl?: string }) {
    return await prisma.coin.create({
      data: {
        symbol: data.symbol,
        name: data.name,
        logoUrl: data.logoUrl
      }
    });
  }

  async updateCoin(id: string, data: Partial<{ symbol: string; name: string; logoUrl?: string }>) {
    return await prisma.coin.update({
      where: { id },
      data
    });
  }

  async deleteCoin(id: string) {
    await prisma.coinNetwork.deleteMany({ where: { coinId: id } });
    await prisma.paymentOption.deleteMany({ where: { coinId: id } });
    await prisma.order.deleteMany({where: { OR: [{ coinToBuyId: id }, { payWithId: id }] }});
    await prisma.exchangeRate.deleteMany({where: { OR: [{ buyCoinId: id }, { payCoinId: id }] }});
    return await prisma.coin.delete({ where: { id } });
  }
}
