import { WalletRepositoryPrisma } from "./wallet.repository";

export class WalletService {
  constructor(private readonly repo: WalletRepositoryPrisma) {}
  async getPaymentAddress(coinId: string, networkId: string) {
    const addr = await this.repo.getPaymentAddress(coinId, networkId);
    if (!addr) return { ok: false, error: new Error("No payment address available") };
    return { ok: true, value: addr };
  }
}
