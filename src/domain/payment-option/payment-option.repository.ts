import { prisma } from "@/lib/prisma";
import { BaseRepository } from "@/domain/common/base.repository";

export type CreatePaymentOptionDTO = {
  coinId: string;
  networkId: string;
  isActive?: boolean;
};

export type UpdatePaymentOptionDTO = Partial<Pick<CreatePaymentOptionDTO, "isActive">>;

/**
 * Filter untuk mengambil payment options aktif.
 * Catatan: properti buy* hanya dipakai di SERVICE (interseksi dengan ExchangeRate),
 * repository ini tetap fokus pada filter pay-side saja.
 */
export type PaymentOptionActiveFilter = {
  // PAY-side filters (sudah ada)
  coinId?: string;
  networkId?: string;
  coinSymbol?: string;
  networkSymbol?: string;

  // BUY-side filters (baru; dipakai di service)
  buyCoinId?: string;
  buyNetworkId?: string;
  buyCoinSymbol?: string;
  buyNetworkSymbol?: string;
};

export class PaymentOptionRepositoryPrisma extends BaseRepository {
  listAll() {
    return prisma.paymentOption.findMany({
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      include: { coin: true, network: true },
    });
  }

  async findActive(filter?: PaymentOptionActiveFilter) {
    const where: any = { isActive: true };

    if (filter?.coinId) where.coinId = filter.coinId;
    if (filter?.networkId) where.networkId = filter.networkId;
    if (filter?.coinSymbol) where.coin = { symbol: filter.coinSymbol };
    if (filter?.networkSymbol) where.network = { symbol: filter.networkSymbol };

    return prisma.paymentOption.findMany({
      where,
      include: { coin: true, network: true },
      orderBy: [{ coin: { symbol: "asc" } }, { network: { symbol: "asc" } }],
    });
  }

  getById(id: string) {
    return prisma.paymentOption.findUnique({
      where: { id },
      include: { coin: true, network: true },
    });
  }

  create(data: CreatePaymentOptionDTO) {
    return prisma.paymentOption.create({
      data: {
        coinId: data.coinId,
        networkId: data.networkId,
        isActive: data.isActive ?? true,
      },
    });
  }

  update(id: string, data: UpdatePaymentOptionDTO) {
    return prisma.paymentOption.update({
      where: { id },
      data,
    });
  }

  toggleActive(id: string, isActive: boolean) {
    return prisma.paymentOption.update({
      where: { id },
      data: { isActive },
    });
  }

  delete(id: string) {
    return prisma.paymentOption.delete({ where: { id } });
  }
}
