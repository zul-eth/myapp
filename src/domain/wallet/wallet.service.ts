import { WalletRepositoryPrisma } from "./wallet.repository";
import { generateNewAddress } from "@/app/actions/wallet";
import { ChainFamily } from "@prisma/client";

export class WalletService {
  constructor(private readonly repo: WalletRepositoryPrisma) {}

  async getOrGenerateAddress(chain: ChainFamily) {
    const idle = await this.repo.getIdleAddress(chain);
    if (idle) return idle;
    return generateNewAddress(chain);
  }

  async assignAddressToOrder(addressId: string, orderId: string) {
    return this.repo.assignAddressToOrder(addressId, orderId);
  }

  async releaseAddress(addressId: string) {
    return this.repo.releaseAddress(addressId);
  }
}
