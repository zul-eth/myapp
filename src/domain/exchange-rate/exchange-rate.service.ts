import { ExchangeRateRepositoryPrisma } from "./exchange-rate.repository";

export class ExchangeRateService {
  constructor(private readonly repo: ExchangeRateRepositoryPrisma) {}

  async getLatest(params: { buyCoinId: string; buyNetworkId: string; payCoinId: string; payNetworkId: string }) {
    return this.repo.getLatest(params);
  }
}
