import { prisma } from "@/lib/prisma";

export class WalletRepositoryPrisma {
  async getPaymentAddress(coinId: string, networkId: string) {
    const opt = await prisma.paymentOption.findUnique({
      where: { coinId_networkId: { coinId, networkId } },
    });
    if (!opt) return null;

    const wallet = await prisma.walletPoolLegacy.findFirst({
      where: { assignedOrder: null, chain: networkId },
    });
    return wallet ? wallet.address : null;
  }
}
