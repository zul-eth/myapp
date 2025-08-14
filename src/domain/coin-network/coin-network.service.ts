import { CoinNetworkRepositoryPrisma } from "./coinNetwork.repository";

export class CoinNetworkService {
  constructor(private readonly repo: CoinNetworkRepositoryPrisma) {}

  async listAll() {
    return this.repo.listAll();
  }

  async create(data: any) {
    return this.repo.createCoinNetwork(data);
  }

  async update(id: string, data: any) {
    return this.repo.updateCoinNetwork(id, data);
  }

  async delete(id: string) {
    return this.repo.deleteCoinNetwork(id);
  }
}
