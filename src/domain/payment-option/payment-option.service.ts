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

  listActive(filter?: PaymentOptionActiveFilter) {
    const normalized = {
      ...filter,
      coinSymbol: up(filter?.coinSymbol),
      networkSymbol: up(filter?.networkSymbol),
    };
    return this.repo.findActive(normalized);
  }

  async create(input: CreatePaymentOptionDTO) {
    try {
      return await this.repo.create(input);
    } catch (e: any) {
      // Unique [coinId, networkId]
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
