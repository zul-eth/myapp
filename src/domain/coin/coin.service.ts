import { CoinRepositoryPrisma } from "./coin.repository";

export class CoinService {
  constructor(private readonly repo: CoinRepositoryPrisma) {}

  async listAll() {
    return await this.repo.findAll();
  }

  async listActive() {
    return await this.repo.findActive();
  }

  async create(data: { symbol: string; name: string; logoUrl?: string }) {
    return await this.repo.createCoin({
      symbol: data.symbol,
      name: data.name,
      logoUrl: data.logoUrl
    });
  }

  async update(id: string, data: Partial<{ symbol: string; name: string; logoUrl?: string }>) {
    return await this.repo.updateCoin(id, data);
  }

  async delete(id: string) {
    return await this.repo.deleteCoin(id);
  }

  async toggleActive(id: string, isActive: boolean) {
    return await this.repo.toggleActive(id, isActive);
  }
}
