import { prisma } from "@/lib/prisma";

/**
 * Repositori pool address (Prisma).
 * Ekspor dengan nama utama `WalletRepositoryPrisma`
 * dan ALIAS `WalletPoolRepository` agar kompatibel dua-duanya.
 */
export class WalletRepositoryPrisma {
  findOneUnused(chain: string) {
    return prisma.walletPoolLegacy.findFirst({
      where: { chain, isUsed: false },
      orderBy: [{ derivationIndex: "asc" }],
    });
  }

  create(input: { chain: string; derivationIndex: number; address: string }) {
    return prisma.walletPoolLegacy.create({
      data: {
        chain: input.chain,
        derivationIndex: input.derivationIndex,
        address: input.address,
        isUsed: false,
      },
    });
  }

  assignToOrder(poolId: string, orderId: string, networkId: string) {
    return prisma.walletPoolLegacy.update({
      where: { id: poolId },
      data: { isUsed: true, assignedOrderId: orderId, networkId },
    });
  }

  releaseByOrderId(orderId: string) {
    return prisma.walletPoolLegacy.updateMany({
      where: { assignedOrderId: orderId },
      data: { isUsed: false, assignedOrderId: null, networkId: null },
    });
  }

  getByOrderId(orderId: string) {
    return prisma.walletPoolLegacy.findFirst({ where: { assignedOrderId: orderId } });
  }
}

// ✅ Alias export supaya keduanya tersedia:
export { WalletRepositoryPrisma as WalletPoolRepository };
