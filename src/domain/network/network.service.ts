import { NetworkRepositoryPrisma, CreateNetworkDTO, UpdateNetworkDTO } from "./network.repository";
const SYMBOL_RE = /^[A-Z0-9_-]{2,20}$/;

const normalize = (s: string) => s.trim().toUpperCase();

export class NetworkService {
  constructor(private readonly repo: NetworkRepositoryPrisma) {}

  listAll() {
    return this.repo.findAll();
  }
  listActive() {
    return this.repo.findAllActive();
  }

  async create(input: CreateNetworkDTO) {
    const data = { ...input, symbol: normalize(input.symbol) };
    if (!SYMBOL_RE.test(data.symbol)) throw new Error("Format symbol tidak valid");
    const exists = await this.repo.findBySymbol(data.symbol);
    if (exists) throw new Error(`Network dengan symbol ${data.symbol} sudah ada`);
    try {
      return await this.repo.createNetwork(data);
    } catch (e: any) {
      if (e.code === "P2002") throw new Error(`Network dengan symbol ${data.symbol} sudah ada`);
      throw e;
    }
  }

  async update(id: string, input: UpdateNetworkDTO) {
    const data = { ...input };
    if (data.symbol !== undefined) {
      data.symbol = normalize(data.symbol);
      if (!SYMBOL_RE.test(data.symbol)) throw new Error("Format symbol tidak valid");
      const other = await this.repo.findBySymbol(data.symbol);
      if (other && other.id !== id) throw new Error(`Network dengan symbol ${data.symbol} sudah ada`);
    }
    try {
      return await this.repo.updateNetwork(id, data);
    } catch (e: any) {
      if (e.code === "P2025") throw new Error("Network tidak ditemukan");
      if (e.code === "P2002") throw new Error(`Network dengan symbol ${data.symbol} sudah ada`);
      throw e;
    }
  }

  async toggleActive(id: string, isActive: boolean) {
    try {
      return await this.repo.toggleActive(id, isActive);
    } catch (e: any) {
      if (e.code === "P2025") throw new Error("Network tidak ditemukan");
      throw e;
    }
  }

  async deleteHard(id: string) {
    try {
      return await this.repo.deleteNetworkCascade(id);
    } catch (e: any) {
      if (e.code === "P2025") throw new Error("Network tidak ditemukan");
      throw e;
    }
  }
}
