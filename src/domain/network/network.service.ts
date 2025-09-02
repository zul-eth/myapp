import { NetworkRepositoryPrisma, CreateNetworkDTO, UpdateNetworkDTO } from "./network.repository";

const SYMBOL_RE = /^[A-Z0-9._-]{2,32}$/;
const normalizeSymbol = (s: string) => s.trim().replace(/\s+/g, "_").toUpperCase();

export class NetworkService {
  constructor(private readonly repo: NetworkRepositoryPrisma) {}

  listAll() {
    return this.repo.findAll();
  }
  listActive() {
    return this.repo.findAllActive();
  }

  async create(input: CreateNetworkDTO) {
    const data = { ...input, symbol: normalizeSymbol(input.symbol), name: input.name.trim() };

    // ✅ symbol boleh duplikat (hanya validasi format)
    if (!SYMBOL_RE.test(data.symbol)) throw new Error("Format symbol tidak valid (2–32, A-Z/0-9/_/./-)");

    // ✅ yang unik adalah NAME
    const byName = await this.repo.findByName(data.name);
    if (byName) throw new Error(`Network dengan name '${data.name}' sudah ada`);

    try {
      return await this.repo.createNetwork(data);
    } catch (e: any) {
      // Prisma juga akan menjaga name unik di level DB
      if (e.code === "P2002") throw new Error(`Network dengan name '${data.name}' sudah ada`);
      throw e;
    }
  }

  async update(id: string, input: UpdateNetworkDTO) {
    const data: UpdateNetworkDTO = { ...input };

    if (data.symbol !== undefined) {
      data.symbol = normalizeSymbol(data.symbol);
      if (!SYMBOL_RE.test(data.symbol)) throw new Error("Format symbol tidak valid");
    }

    if (data.name !== undefined) {
      data.name = data.name.trim();
      const byName = await this.repo.findByName(data.name);
      if (byName && byName.id !== id) throw new Error(`Network dengan name '${data.name}' sudah ada`);
    }

    try {
      return await this.repo.updateNetwork(id, data);
    } catch (e: any) {
      if (e.code === "P2025") throw new Error("Network tidak ditemukan");
      if (e.code === "P2002") throw new Error("Name sudah digunakan");
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
