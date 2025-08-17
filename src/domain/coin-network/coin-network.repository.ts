import { prisma } from "@/lib/prisma";
import { BaseRepository } from "@/domain/common/base.repository";
import type { AssetType, MemoKind } from "@prisma/client";

export type CreateCoinNetworkDTO = {
  coinId: string;
  networkId: string;
  assetType?: AssetType;
  contractAddress?: string | null;
  decimals?: number | null;
  symbolOverride?: string | null;
  memoKind?: MemoKind;
  memoLabel?: string | null;
  memoRegex?: string | null;
  isActive?: boolean;
};

export type UpdateCoinNetworkDTO = Partial<CreateCoinNetworkDTO> & {
  coinId?: never;
  networkId?: never;
};

export class CoinNetworkRepositoryPrisma extends BaseRepository<typeof prisma.coinNetwork> {
  constructor() {
    super(prisma.coinNetwork);
  }

  listAll() {
    return prisma.coinNetwork.findMany({
      orderBy: [{ isActive: "desc" }, { id: "desc" }],
      include: { coin: true, network: true },
    });
  }

  getById(id: string) {
    return prisma.coinNetwork.findUnique({ where: { id }, include: { coin: true, network: true } });
  }

  create(data: CreateCoinNetworkDTO) {
    return prisma.coinNetwork.create({ data });
  }

  update(id: string, data: UpdateCoinNetworkDTO) {
    return prisma.coinNetwork.update({ where: { id }, data });
  }

  toggleActive(id: string, isActive: boolean) {
    return prisma.coinNetwork.update({ where: { id }, data: { isActive } });
  }

  delete(id: string) {
    return prisma.coinNetwork.delete({ where: { id } });
  }
}
