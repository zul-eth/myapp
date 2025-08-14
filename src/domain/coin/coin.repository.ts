import { prisma } from "@/lib/prisma";
import { BaseRepository } from "@/domain/common/base.repository";
import { OrderStatus } from "@prisma/client";

export class CoinRepositoryPrisma extends BaseRepository<typeof prisma.coin> {
  constructor() {
    super(prisma.coin);
  }

  async findAllClean() {
    return prisma.coin.findMany({
      orderBy: { createdAt: "desc" }
    });
  }

  async createCoin(data: { symbol: string; name: string; logoUrl?: string }) {
    const symbol = data.symbol.trim().toUpperCase();
    const name = data.name.trim();

    if (!symbol) throw new Error("Symbol wajib diisi");
    if (!name) throw new Error("Name wajib diisi");

    const exists = await prisma.coin.findFirst({
      where: { symbol: { equals: symbol, mode: "insensitive" } }
    });
    if (exists) throw new Error(`Coin dengan symbol ${symbol} sudah ada`);

    return prisma.coin.create({
      data: {
        symbol,
        name,
        logoUrl: data.logoUrl?.trim() || null
      }
    });
  }

  async updateCoin(
    id: string,
    data: Partial<{ symbol: string; name: string; logoUrl?: string }>
  ) {
    const updateData: any = {};

    if (data.symbol) {
      const symbol = data.symbol.trim().toUpperCase();
      const exists = await prisma.coin.findFirst({
        where: { symbol: { equals: symbol, mode: "insensitive" }, NOT: { id } }
      });
      if (exists) throw new Error(`Coin dengan symbol ${symbol} sudah ada`);
      updateData.symbol = symbol;
    }

    if (data.name) {
      updateData.name = data.name.trim();
    }

    if (data.logoUrl !== undefined) {
      updateData.logoUrl = data.logoUrl?.trim() || null;
    }

    return prisma.coin.update({
      where: { id },
      data: updateData
    });
  }

  async deleteCoin(id: string) {
    // Status order yang dianggap aktif → coin tidak dihapus permanen
    const activeStatuses = [
      OrderStatus.PENDING,
      OrderStatus.WAITING_PAYMENT,
      OrderStatus.UNDERPAID,
      OrderStatus.WAITING_CONFIRMATION
    ];

    const activeOrder = await prisma.order.findFirst({
      where: {
        OR: [{ coinToBuyId: id }, { payWithId: id }],
        status: { in: activeStatuses }
      }
    });

    if (activeOrder) {
      await prisma.coin.update({
        where: { id },
        data: { isActive: false }
      });
      return {
        success: true,
        type: "soft-delete",
        message: "Coin dinonaktifkan karena masih digunakan di order aktif"
      };
    }

    // Hard delete semua relasi sesuai model
    await prisma.coinNetwork.deleteMany({ where: { coinId: id } });
    await prisma.paymentOption.deleteMany({ where: { coinId: id } });
    await prisma.order.deleteMany({
      where: { OR: [{ coinToBuyId: id }, { payWithId: id }] }
    });
    await prisma.exchangeRate.deleteMany({
      where: { OR: [{ buyCoinId: id }, { payCoinId: id }] }
    });
    await prisma.coin.delete({ where: { id } });

    return {
      success: true,
      type: "hard-delete",
      message: "Coin dihapus permanen"
    };
  }
}
