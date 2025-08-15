import { prisma } from "@/lib/prisma";
import { ChainFamily } from "@prisma/client";

export class WalletRepositoryPrisma {
  async getIdleAddress(chain: ChainFamily) {
    return prisma.walletPoolLegacy.findFirst({
      where: { chain, isUsed: false },
      orderBy: { createdAt: "asc" }
    });
  }

  async assignAddressToOrder(addressId: string, orderId: string) {
    return prisma.walletPoolLegacy.update({
      where: { id: addressId },
      data: { isUsed: true, assignedOrderId: orderId }
    });
  }

  async releaseAddress(addressId: string) {
    return prisma.walletPoolLegacy.update({
      where: { id: addressId },
      data: { isUsed: false, assignedOrderId: null }
    });
  }
}
