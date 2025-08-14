import { ExchangeRateRepositoryPrisma } from "./exchangeRate.repository";

export class ExchangeRateService {
  constructor(private readonly repo: ExchangeRateRepositoryPrisma) {}

  async listAll() {
    return this.repo.listAll();
  }

  async create(data: any) {
    return this.repo.createExchangeRate(data);
  }

  async update(id: string, data: any) {
    return this.repo.updateExchangeRate(id, data);
  }

  async delete(id: string) {
    return this.repo.deleteExchangeRate(id);
  }
}
