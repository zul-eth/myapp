import { NetworkRepositoryPrisma } from "./network.repository";

export class NetworkService {
  constructor(private readonly repo: NetworkRepositoryPrisma) {}

  async listAll() {
    return this.repo.findAllClean();
  }

  async create(data: {
    name: string;
    logoUrl?: string;
    family: string;
    chainId?: string;
    symbol?: string;
    rpcUrl?: string;
    explorer?: string;
  }) {
    return this.repo.createNetwork(data);
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      logoUrl?: string;
      family?: string;
      chainId?: string;
      symbol?: string;
      rpcUrl?: string;
      explorer?: string;
    }>
  ) {
    return this.repo.updateNetwork(id, data);
  }

  async delete(id: string) {
    return this.repo.deleteNetwork(id);
  }

  async toggleActive(id: string, isActive: boolean) {
    return this.repo.toggleActive(id, isActive);
  }
}
