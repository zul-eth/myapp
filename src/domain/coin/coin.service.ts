import { CoinRepositoryPrisma, CreateCoinDTO, UpdateCoinDTO } from "./coin.repository";

// Validasi sederhana sesuai kebutuhan model
const SYMBOL_RE = /^[A-Z0-9_-]{2,15}$/;

function normalizeSymbol(s: string) {
  return s.trim().toUpperCase();
}

function validateCreate(data: CreateCoinDTO) {
  if (!data.symbol || !data.name) throw new Error("Symbol dan name wajib diisi");
  const symbol = normalizeSymbol(data.symbol);
  if (!SYMBOL_RE.test(symbol)) {
    throw new Error("Format symbol tidak valid (2-15, A-Z/0-9/_/-)");
  }
  if (data.name.trim().length < 2) throw new Error("Nama terlalu pendek");
  return { ...data, symbol };
}

function validateUpdate(data: UpdateCoinDTO) {
  const out: UpdateCoinDTO = { ...data };
  if (out.symbol !== undefined) {
    out.symbol = normalizeSymbol(out.symbol);
    if (!SYMBOL_RE.test(out.symbol)) {
      throw new Error("Format symbol tidak valid (2-15, A-Z/0-9/_/-)");
    }
  }
  if (out.name !== undefined && out.name.trim().length < 2) {
    throw new Error("Nama terlalu pendek");
  }
  return out;
}

export class CoinService {
  constructor(private readonly repo: CoinRepositoryPrisma) {}

  async listAll() {
    return this.repo.findAllClean();
  }
  
  async listActive() {
    return this.repo.findAllActive();
  }

  async create(input: CreateCoinDTO) {
    const data = validateCreate(input);
    try {
      // Cek unik symbol lebih awal agar error message ramah
      const exists = await this.repo.findBySymbol(data.symbol);
      if (exists) throw new Error(`Coin dengan symbol ${data.symbol} sudah ada`);
      return await this.repo.createCoin(data);
    } catch (e: any) {
      if (e.code === "P2002") {
        throw new Error(`Coin dengan symbol ${data.symbol} sudah ada`);
      }
      throw e;
    }
  }

  async update(id: string, input: UpdateCoinDTO) {
    const data = validateUpdate(input);
    try {
      // Jika update symbol, pastikan tidak bentrok dengan yang lain
      if (data.symbol) {
        const other = await this.repo.findBySymbol(data.symbol);
        if (other && other.id !== id) {
          throw new Error(`Coin dengan symbol ${data.symbol} sudah ada`);
        }
      }
      return await this.repo.updateCoin(id, data);
    } catch (e: any) {
      if (e.code === "P2025") {
        throw new Error("Coin tidak ditemukan");
      }
      if (e.code === "P2002") {
        throw new Error(`Coin dengan symbol ${data.symbol} sudah ada`);
      }
      throw e;
    }
  }

  async toggleActive(id: string, isActive: boolean) {
    if (typeof isActive !== "boolean") throw new Error("isActive harus boolean");
    try {
      return await this.repo.toggleActive(id, isActive);
    } catch (e: any) {
      if (e.code === "P2025") throw new Error("Coin tidak ditemukan");
      throw e;
    }
  }

  async deleteHard(id: string) {
    try {
      return await this.repo.deleteCoinCascade(id);
    } catch (e: any) {
      if (e.code === "P2025") throw new Error("Coin tidak ditemukan");
      throw e;
    }
  }
}
