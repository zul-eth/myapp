import { PaymentOptionRepositoryPrisma } from "./payment-option.repository";

export class PaymentOptionService {
  constructor(private readonly repo: PaymentOptionRepositoryPrisma) {}
  list() {
    return this.repo.list();
  }
}
