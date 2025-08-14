import { NetworkRepositoryPrisma } from "./network.repository";

export class NetworkService {
  constructor(private readonly repo: NetworkRepositoryPrisma) {}

  async list() {
    return this.repo.findAll();
  }

  async get(id: string) {
    return this.repo.findById(id);
  }

  async create(data: {
    name: string;
    logoUrl?: string;
    family?: string;
    chainId?: string;
    symbol?: string;
    rpcUrl?: string;
    explorer?: string;
  }) {
    return this.repo.create(data);
  }

  async update(
    id: string,
    data: {
      name?: string;
      logoUrl?: string;
      family?: string;
      chainId?: string;
      symbol?: string;
      rpcUrl?: string;
      explorer?: string;
    }
  ) {
    return this.repo.update(id, data);
  }

  async delete(id: string) {
    return this.repo.delete(id);
  }
}
