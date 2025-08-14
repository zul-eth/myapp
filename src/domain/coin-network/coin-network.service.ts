import { CoinNetworkRepositoryPrisma } from "./coin-network.repository";

export class CoinNetworkService {
  constructor(private readonly repo: CoinNetworkRepositoryPrisma) {}

  async list() {
    return this.repo.findAll();
  }

  async get(id: string) {
    return this.repo.findById(id);
  }

  async create(data: { coinId: string; networkId: string }) {
    return this.repo.create(data);
  }

  async update(id: string, data: { coinId?: string; networkId?: string }) {
    return this.repo.update(id, data);
  }

  async delete(id: string) {
    return this.repo.delete(id);
  }
}
