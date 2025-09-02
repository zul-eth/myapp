import { prisma } from "@/lib/prisma";
import {
  PaymentOptionRepositoryPrisma,
  CreatePaymentOptionDTO,
  UpdatePaymentOptionDTO,
  PaymentOptionActiveFilter,
} from "./payment-option.repository";

const up = (s?: string) => (typeof s === "string" ? s.trim().toUpperCase() : s);

export class PaymentOptionService {
  constructor(private readonly repo: PaymentOptionRepositoryPrisma) {}

  listAll() {
    return this.repo.listAll();
  }

  async listActive(filter?: PaymentOptionActiveFilter) {
    const normalized: PaymentOptionActiveFilter = {
      ...filter,
      coinSymbol: up(filter?.coinSymbol),
      networkSymbol: up(filter?.networkSymbol),
      buyCoinSymbol: up(filter?.buyCoinSymbol),
      buyNetworkSymbol: up(filter?.buyNetworkSymbol),
    };

    // Ambil seluruh payment options aktif (dengan filter pay-side bila ada)
    const options = await this.repo.findActive(normalized);

    // Jika tidak ada filter BUY -> kembalikan apa adanya (global)
    if (
      !normalized.buyCoinId &&
      !normalized.buyNetworkId &&
      !normalized.buyCoinSymbol &&
      !normalized.buyNetworkSymbol
    ) {
      return options;
    }

    // Resolve buyCoinId & buyNetworkId bila hanya symbol yang diberikan
    let buyCoinId = normalized.buyCoinId || null;
    let buyNetworkId = normalized.buyNetworkId || null;

    if (!buyCoinId && normalized.buyCoinSymbol) {
      const c = await prisma.coin.findUnique({ where: { symbol: normalized.buyCoinSymbol } });
      buyCoinId = c?.id ?? null;
    }
    if (!buyNetworkId) {
      if (normalized.buyNetworkId) buyNetworkId = normalized.buyNetworkId;
      else if (normalized.buyNetworkSymbol) {
        const n = await prisma.network.findFirst({
          where: { OR: [{ symbol: normalized.buyNetworkSymbol }, { name: normalized.buyNetworkSymbol }] },
        });
        buyNetworkId = n?.id ?? null;
      }
    }

    // Jika buy pair belum resolve → aman kembalikan kosong (tidak ada rate yang bisa dicocokkan)
    if (!buyCoinId || !buyNetworkId) {
      return [];
    }

    // Ambil semua rate untuk pasangan BELI tsb.
    const rates = await prisma.exchangeRate.findMany({
      where: { buyCoinId, buyNetworkId },
      select: { payCoinId: true, payNetworkId: true },
    });

    if (!rates.length) return [];

    const allowed = new Set(rates.map((r) => `${r.payCoinId}:${r.payNetworkId}`));
    return options.filter((opt) => allowed.has(`${opt.coinId}:${opt.networkId}`));
  }

  async create(input: CreatePaymentOptionDTO) {
    try {
      return await this.repo.create(input);
    } catch (e: any) {
      if (e?.code === "P2002") {
        throw new Error("PaymentOption (coinId, networkId) sudah ada");
      }
      throw e;
    }
  }

  update(id: string, input: UpdatePaymentOptionDTO) {
    return this.repo.update(id, input);
  }

  toggleActive(id: string, isActive: boolean) {
    return this.repo.toggleActive(id, isActive);
  }

  delete(id: string) {
    return this.repo.delete(id);
  }
}
