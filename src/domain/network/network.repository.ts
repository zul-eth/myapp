import { prisma } from "@/lib/prisma";
import { BaseRepository } from "@/domain/common/base.repository";
import { OrderStatus } from "@prisma/client";

export class NetworkRepositoryPrisma extends BaseRepository<typeof prisma.network> {
  constructor() {
    super(prisma.network);
  }

  async findAllClean() {
    return prisma.network.findMany({
      orderBy: { createdAt: "desc" }
    });
  }

  async createNetwork(data: {
    name: string;
    logoUrl?: string;
    family: string;
    chainId?: string;
    symbol?: string;
    rpcUrl?: string;
    explorer?: string;
  }) {
    const name = data.name.trim();
    if (!name) throw new Error("Name wajib diisi");

    const exists = await prisma.network.findFirst({
      where: { name: { equals: name, mode: "insensitive" } }
    });
    if (exists) throw new Error(`Network dengan name ${name} sudah ada`);

    return prisma.network.create({
      data: {
        name,
        logoUrl: data.logoUrl?.trim() || null,
        family: data.family,
        chainId: data.chainId || null,
        symbol: data.symbol || null,
        rpcUrl: data.rpcUrl || null,
        explorer: data.explorer || null
      }
    });
  }

  async updateNetwork(
    id: string,
    data: Partial<{
      name: string;
      logoUrl?: string;
      family?: string;
      chainId?: string;
      symbol?: string;
      rpcUrl?: string;
      explorer?: string;
    }>
  ) {
    const updateData: any = {};

    if (data.name) {
      const name = data.name.trim();
      const exists = await prisma.network.findFirst({
        where: { name: { equals: name, mode: "insensitive" }, NOT: { id } }
      });
      if (exists) throw new Error(`Network dengan name ${name} sudah ada`);
      updateData.name = name;
    }

    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl?.trim() || null;
    if (data.family !== undefined) updateData.family = data.family;
    if (data.chainId !== undefined) updateData.chainId = data.chainId;
    if (data.symbol !== undefined) updateData.symbol = data.symbol;
    if (data.rpcUrl !== undefined) updateData.rpcUrl = data.rpcUrl;
    if (data.explorer !== undefined) updateData.explorer = data.explorer;

    return prisma.network.update({
      where: { id },
      data: updateData
    });
  }

  async deleteNetwork(id: string) {
    const activeStatuses = [
      OrderStatus.PENDING,
      OrderStatus.WAITING_PAYMENT,
      OrderStatus.UNDERPAID,
      OrderStatus.WAITING_CONFIRMATION
    ];

    const activeOrder = await prisma.order.findFirst({
      where: {
        OR: [{ buyNetworkId: id }, { payNetworkId: id }],
        status: { in: activeStatuses }
      }
    });

    if (activeOrder) {
      await prisma.network.update({
        where: { id },
        data: { isActive: false }
      });
      return { success: true, type: "soft-delete", message: "Network dinonaktifkan karena masih digunakan di order aktif" };
    }

    await prisma.coinNetwork.deleteMany({ where: { networkId: id } });
    await prisma.paymentOption.deleteMany({ where: { networkId: id } });
    await prisma.order.deleteMany({
      where: { OR: [{ buyNetworkId: id }, { payNetworkId: id }] }
    });
    await prisma.exchangeRate.deleteMany({
      where: { OR: [{ buyNetworkId: id }, { payNetworkId: id }] }
    });
    await prisma.network.delete({ where: { id } });

    return { success: true, type: "hard-delete", message: "Network dihapus permanen" };
  }
}
