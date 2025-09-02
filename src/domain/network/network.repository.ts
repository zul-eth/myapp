import { prisma } from "@/lib/prisma";
import { BaseRepository } from "@/domain/common/base.repository";
import type { ChainFamily } from "@prisma/client";

export type CreateNetworkDTO = {
  symbol: string;
  name: string;
  family: ChainFamily;
  isActive?: boolean;
};
export type UpdateNetworkDTO = Partial<CreateNetworkDTO>;

export class NetworkRepositoryPrisma extends BaseRepository<typeof prisma.network> {
  constructor() {
    super(prisma.network);
  }

  findAll() {
    return prisma.network.findMany({ orderBy: { symbol: "asc" } });
  }

  findAllActive() {
    return prisma.network.findMany({
      where: { isActive: true },
      orderBy: { symbol: "asc" },
    });
  }

  findById(id: string) {
    return prisma.network.findUnique({ where: { id } });
  }

  // NOTE: name unik → aman pakai findUnique
  findByName(name: string) {
    return prisma.network.findUnique({ where: { name } });
  }

  // symbol TIDAK unik → pakai findFirst jika masih dibutuhkan
  findBySymbol(symbol: string) {
    return prisma.network.findFirst({ where: { symbol } });
  }

  createNetwork(data: CreateNetworkDTO) {
    return prisma.network.create({
      data: {
        symbol: data.symbol,
        name: data.name,
        family: data.family,
        isActive: data.isActive ?? true,
      } as any,
    });
  }

  updateNetwork(id: string, data: UpdateNetworkDTO) {
    const patch: any = {};
    if (data.symbol !== undefined) patch.symbol = data.symbol;
    if (data.name !== undefined) patch.name = data.name;
    if (data.family !== undefined) patch.family = data.family;
    if (data.isActive !== undefined) patch.isActive = data.isActive;

    return prisma.network.update({
      where: { id },
      data: patch,
    });
  }

  async deleteNetworkCascade(id: string) {
    return prisma.$transaction(async (tx) => {
      await tx.coinNetwork.deleteMany({ where: { networkId: id } });
      await tx.paymentOption.deleteMany({ where: { networkId: id } });
      await tx.order.deleteMany({ where: { OR: [{ buyNetworkId: id }, { payNetworkId: id }] } });
      await tx.exchangeRate.deleteMany({ where: { OR: [{ buyNetworkId: id }, { payNetworkId: id }] } });
      await tx.network.delete({ where: { id } });
      return { success: true, type: "hard-delete", message: "Network dihapus permanen" };
    });
  }
}
