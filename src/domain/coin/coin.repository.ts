import { prisma } from "@/lib/prisma";
import { BaseRepository } from "@/domain/common/base.repository";

export type CreateCoinDTO = {
  symbol: string;
  name: string;
  logoUrl?: string | null;
};

export type UpdateCoinDTO = Partial<CreateCoinDTO> & {
  isActive?: boolean;
};

export class CoinRepositoryPrisma extends BaseRepository<typeof prisma.coin> {
  constructor() {
    super(prisma.coin);
  }

  async findAllActive() {
    return prisma.coin.findMany({
      where: { isActive: true },
      orderBy: { symbol: "asc" },
    });
  }

  async findAllClean() {
    return prisma.coin.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string) {
    return prisma.coin.findUnique({ where: { id } });
  }

  async findBySymbol(symbol: string) {
    return prisma.coin.findUnique({ where: { symbol } });
  }

  async createCoin(data: CreateCoinDTO) {
    return prisma.coin.create({
      data: {
        symbol: data.symbol,
        name: data.name,
        logoUrl: data.logoUrl ?? null,
        // isActive default true oleh Prisma
      },
    });
  }

  async updateCoin(id: string, data: UpdateCoinDTO) {
    return prisma.coin.update({
      where: { id },
      data: {
        ...(data.symbol !== undefined ? { symbol: data.symbol } : {}),
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.logoUrl !== undefined ? { logoUrl: data.logoUrl ?? null } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
  }

  async toggleActive(id: string, isActive: boolean) {
    return prisma.coin.update({
      where: { id },
      data: { isActive },
    });
  }

  /**
   * Hard delete satu coin beserta semua relasinya agar konsisten dengan skema:
   * - PaymentOption (coinId)
   * - CoinNetwork (coinId)
   * - Payment (coinId)
   * - Order (coinToBuyId / payWithId)
   * - ExchangeRate (buyCoinId / payCoinId)
   */
  async deleteCoinCascade(id: string) {
    return prisma.$transaction(async (tx) => {
      await tx.payment.deleteMany({ where: { coinId: id } });
      await tx.paymentOption.deleteMany({ where: { coinId: id } });
      await tx.coinNetwork.deleteMany({ where: { coinId: id } });

      await tx.order.deleteMany({
        where: { OR: [{ coinToBuyId: id }, { payWithId: id }] },
      });

      await tx.exchangeRate.deleteMany({
        where: { OR: [{ buyCoinId: id }, { payCoinId: id }] },
      });

      await tx.coin.delete({ where: { id } });

      return { success: true, type: "hard-delete", message: "Coin dihapus permanen" };
    });
  }
}
