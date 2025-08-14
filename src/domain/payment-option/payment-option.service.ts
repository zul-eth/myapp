import { PaymentOptionRepositoryPrisma } from "./paymentOption.repository";

export class PaymentOptionService {
  constructor(private readonly repo: PaymentOptionRepositoryPrisma) {}

  async listAll() {
    return this.repo.listAll();
  }

  async create(data: { coinId: string; networkId: string }) {
    return this.repo.createPaymentOption(data);
  }

  async update(id: string, data: { isActive?: boolean }) {
    return this.repo.updatePaymentOption(id, data);
  }

  async delete(id: string) {
    return this.repo.deletePaymentOption(id);
  }
}
