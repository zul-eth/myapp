import { ExchangeRateRepositoryPrisma } from "./exchange-rate.repository";

export class ExchangeRateService {
  constructor(private readonly repo: ExchangeRateRepositoryPrisma) {}

  async listAll() {
    return this.repo.listAll();
  }

  async getById(id: string) {
    return this.repo.findById(id);
  }

  async getLatest(params: {
    buyCoinId: string;
    buyNetworkId: string;
    payCoinId: string;
    payNetworkId: string;
  }) {
    return this.repo.findLatestByComposite(params);
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
