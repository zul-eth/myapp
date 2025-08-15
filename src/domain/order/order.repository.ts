import { prisma } from "@/lib/prisma";
import { OrderStatus, Prisma } from "@prisma/client";

export class OrderRepositoryPrisma {
  async listAll(params?: {
    status?: OrderStatus;
    search?: string;
    skip?: number;
    take?: number;
  }) {
    const where: Prisma.OrderWhereInput = {};
    if (params?.status) where.status = params.status;
    if (params?.search) {
      where.OR = [
        { receivingAddr: { contains: params.search, mode: "insensitive" } },
        { paymentAddr: { contains: params.search, mode: "insensitive" } },
        { txHash: { contains: params.search, mode: "insensitive" } },
      ];
    }
    return prisma.order.findMany({
      where,
      skip: params?.skip,
      take: params?.take ?? 50,
      orderBy: { createdAt: "desc" },
      include: {
        coinToBuy: true,
        buyNetwork: true,
        payWith: true,
        payNetwork: true,
        walletPoolLegacy: true,
      },
    });
  }

  async findById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        coinToBuy: true,
        buyNetwork: true,
        payWith: true,
        payNetwork: true,
        walletPoolLegacy: true,
      },
    });
  }

  async createOrder(data: Prisma.OrderUncheckedCreateInput) {
    return prisma.order.create({ data });
  }

  async updateOrder(id: string, data: Prisma.OrderUncheckedUpdateInput) {
    return prisma.order.update({ where: { id }, data });
  }
}
