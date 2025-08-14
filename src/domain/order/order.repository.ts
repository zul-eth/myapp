import { prisma } from "@/lib/prisma";
import { BaseRepository } from "@/domain/common/base.repository";
import { OrderStatus } from "@prisma/client";

export class OrderRepositoryPrisma extends BaseRepository<typeof prisma.order> {
  constructor() {
    super(prisma.order);
  }

  async listAll(params?: {
    status?: OrderStatus;
    search?: string;
    skip?: number;
    take?: number;
  }) {
    return prisma.order.findMany({
      where: {
        status: params?.status,
        OR: params?.search
          ? [
              { coinToBuy: { symbol: { contains: params.search, mode: "insensitive" } } },
              { payWith: { symbol: { contains: params.search, mode: "insensitive" } } },
              { id: { contains: params.search, mode: "insensitive" } }
            ]
          : undefined
      },
      include: {
        coinToBuy: true,
        buyNetwork: true,
        payWith: true,
        payNetwork: true
      },
      orderBy: { createdAt: "desc" },
      skip: params?.skip,
      take: params?.take
    });
  }

  async findById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        coinToBuy: true,
        buyNetwork: true,
        payWith: true,
        payNetwork: true
      }
    });
  }

  async createOrder(data: any) {
    return prisma.order.create({ data });
  }

  async updateOrder(id: string, data: any) {
    return prisma.order.update({ where: { id }, data });
  }

  async deleteOrder(id: string) {
    return prisma.order.delete({ where: { id } });
  }

  async listByClient(clientId: string) {
    return prisma.order.findMany({
      where: { /* nanti tambahkan relasi user jika ada */ },
      orderBy: { createdAt: "desc" },
      include: {
        coinToBuy: true,
        buyNetwork: true,
        payWith: true,
        payNetwork: true
      }
    });
  }
}
