import { prisma } from "@/lib/prisma";

export class NetworkRepositoryPrisma {
  async findAll() {
    return prisma.network.findMany({ where: { isActive: true } });
  }

  async findById(id: string) {
    return prisma.network.findUnique({ where: { id } });
  }

  async create(data: {
    name: string;
    logoUrl?: string;
    family?: string;
    chainId?: string;
    symbol?: string;
    rpcUrl?: string;
    explorer?: string;
  }) {
    return prisma.network.create({ data });
  }

  async update(
    id: string,
    data: {
      name?: string;
      logoUrl?: string;
      family?: string;
      chainId?: string;
      symbol?: string;
      rpcUrl?: string;
      explorer?: string;
    }
  ) {
    return prisma.network.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.network.delete({ where: { id } });
  }
}
