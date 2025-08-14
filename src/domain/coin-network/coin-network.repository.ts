import { prisma } from "@/lib/prisma";

export class CoinNetworkRepositoryPrisma {
  async findAll() {
    return prisma.coinNetwork.findMany({
      include: {
        coin: {
          select: {
            id: true,
            symbol: true,
            name: true,
            logoUrl: true
          }
        },
        network: {
          select: {
            id: true,
            name: true,
            family: true,
            symbol: true,   // simbol native per network
            logoUrl: true
          }
        }
      }
    });
  }

  async findById(id: string) {
    return prisma.coinNetwork.findUnique({
      where: { id },
      include: {
        coin: {
          select: { id: true, symbol: true, name: true, logoUrl: true }
        },
        network: {
          select: { id: true, name: true, family: true, symbol: true, logoUrl: true }
        }
      }
    });
  }

  async create(data: { coinId: string; networkId: string }) {
    return prisma.coinNetwork.create({ data });
  }

  async update(id: string, data: { coinId?: string; networkId?: string }) {
    return prisma.coinNetwork.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.coinNetwork.delete({ where: { id } });
  }
}
