import { prisma } from "@/lib/prisma";
import { BaseRepository } from "@/domain/common/base.repository";

export type CreateExchangeRateDTO = {
  buyCoinId: string;
  buyNetworkId: string;
  payCoinId: string;
  payNetworkId: string;
  rate: number;
  updatedBy?: string | null;
};

export type UpdateExchangeRateDTO = Partial<Pick<CreateExchangeRateDTO, "rate" | "updatedBy">>;

export class ExchangeRateRepositoryPrisma extends BaseRepository<typeof prisma.exchangeRate> {
  constructor() {
    super(prisma.exchangeRate);
  }

  listAll() {
    return prisma.exchangeRate.findMany({
      orderBy: [{ updatedAt: "desc" }],
      include: {
        buyCoin: true,
        buyNetwork: true,
        payCoin: true,
        payNetwork: true,
      },
    });
  }

  create(data: CreateExchangeRateDTO) {
    return prisma.exchangeRate.create({ data });
  }

  update(id: string, data: UpdateExchangeRateDTO) {
    return prisma.exchangeRate.update({ where: { id }, data });
  }

  delete(id: string) {
    return prisma.exchangeRate.delete({ where: { id } });
  }
}
