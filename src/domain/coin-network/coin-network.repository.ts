import { prisma } from "@/lib/prisma";
import { BaseRepository } from "@/domain/common/base.repository";

export class CoinNetworkRepositoryPrisma extends BaseRepository<typeof prisma.coinNetwork> {
  constructor() {
    super(prisma.coinNetwork);
  }

  async listAll() {
    return prisma.coinNetwork.findMany({
      include: {
        coin: true,
        network: true
      },
      orderBy: { createdAt: "desc" }
    });
  }

  async createCoinNetwork(data: {
    coinId: string;
    networkId: string;
    assetType?: string;
    contractAddress?: string;
    decimals?: number;
    symbolOverride?: string;
    memoKind?: string;
    memoLabel?: string;
    memoRegex?: string;
  }) {
    // Cek kombinasi unik coinId + networkId
    const exists = await prisma.coinNetwork.findFirst({
      where: { coinId: data.coinId, networkId: data.networkId }
    });
    if (exists) throw new Error("CoinNetwork ini sudah ada");

    return prisma.coinNetwork.create({
      data: {
        coinId: data.coinId,
        networkId: data.networkId,
        assetType: data.assetType || "NATIVE",
        contractAddress: data.contractAddress || null,
        decimals: data.decimals ?? 18,
        symbolOverride: data.symbolOverride || null,
        memoKind: data.memoKind || "NONE",
        memoLabel: data.memoLabel || null,
        memoRegex: data.memoRegex || null
      }
    });
  }

  async updateCoinNetwork(
    id: string,
    data: Partial<{
      assetType?: string;
      contractAddress?: string;
      decimals?: number;
      symbolOverride?: string;
      memoKind?: string;
      memoLabel?: string;
      memoRegex?: string;
      isActive?: boolean;
    }>
  ) {
    return prisma.coinNetwork.update({
      where: { id },
      data
    });
  }

  async deleteCoinNetwork(id: string) {
    return prisma.coinNetwork.delete({ where: { id } });
  }
}
