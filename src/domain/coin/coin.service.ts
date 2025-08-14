import { CoinRepositoryPrisma } from "./coin.repository";

export class CoinService {
  constructor(private readonly repo: CoinRepositoryPrisma) {}

  async listAll() {
    return this.repo.findAllClean();
  }

  async create(data: { symbol: string; name: string; logoUrl?: string }) {
    return this.repo.createCoin(data);
  }

  async update(id: string, data: Partial<{ symbol: string; name: string; logoUrl?: string }>) {
    return this.repo.updateCoin(id, data);
  }

  async delete(id: string) {
    return this.repo.deleteCoin(id);
  }

  async toggleActive(id: string, isActive: boolean) {
    return this.repo.toggleActive(id, isActive);
  }
}
