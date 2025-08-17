import { prisma } from "@/lib/prisma";
import { ChainFamily } from "@prisma/client";
import type { UniversalChain } from "@/lib/hdwallet/universal";
import { WalletRepositoryPrisma } from "./wallet.repository";
import { hdAllocateNew } from "@/app/actions/wallet/hd-allocate";

function mapFamilyToUniversal(f: ChainFamily): UniversalChain {
  switch (f) {
    case "EVM": return "evm";
    case "TRON": return "tron";
    case "SOLANA": return "solana";
    case "EOS": return "eos";
    case "DOGE": return "doge";
    case "SUI": return "sui";
    case "LTC": return "ltc";
    case "TON": return "ton";
    default: throw new Error(`ChainFamily ${f} belum didukung generator universal`);
  }
}

/**
 * Service sesuai konstruktor di ApplicationManager:
 *   const walletService = new WalletService(walletRepo)
 */
export class WalletService {
  constructor(private readonly repo: WalletRepositoryPrisma) {}

  /**
   * Ambil 1 address untuk networkId:
   * - coba stok pool yang belum terpakai
   * - kalau kosong → derive baru via Server Action (aman), lalu simpan ke pool
   */
  async allocateForNetwork(networkId: string) {
    const net = await prisma.network.findUnique({ where: { id: networkId } });
    if (!net) throw new Error("Network tidak ditemukan");
    const chain = mapFamilyToUniversal(net.family);

    const stock = await this.repo.findOneUnused(chain);
    if (stock) return stock;

    // derive baru (hindari race di unique derivationIndex)
    for (let attempt = 0; attempt < 3; attempt++) {
      const { index, address } = await hdAllocateNew(chain);
      try {
        const created = await this.repo.create({ chain, derivationIndex: index, address });
        return created;
      } catch (e) {
        if (attempt === 2) throw e;
      }
    }
    throw new Error("Gagal menyiapkan address baru");
  }

  async assignToOrder(poolId: string, orderId: string, networkId: string) {
    return this.repo.assignToOrder(poolId, orderId, networkId);
  }

  async releaseForOrder(orderId: string) {
    await this.repo.releaseByOrderId(orderId);
  }

  async getPoolByOrder(orderId: string) {
    return this.repo.getByOrderId(orderId);
  }
}
