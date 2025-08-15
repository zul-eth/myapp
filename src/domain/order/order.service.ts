import { OrderRepositoryPrisma } from "./order.repository";
import { OrderStatus, ChainFamily } from "@prisma/client";
import { WalletService } from "../wallet/wallet.service";
import { ExchangeRateService } from "../exchange-rate/exchange-rate.service";

export class OrderService {
  constructor(
    private readonly repo: OrderRepositoryPrisma,
    private readonly rateService: ExchangeRateService,
    private readonly walletService: WalletService
  ) {}

  async create(data: any) {
    if (data.coinToBuyId === data.payWithId && data.buyNetworkId === data.payNetworkId) {
      throw new Error("Buy dan Pay tidak boleh sama pada network yang sama");
    }

    const network = await this.repo.getNetworkById(data.payNetworkId);
    if (!network) throw new Error("Network not found");

    const pool = await this.walletService.getOrGenerateAddress(network.family as ChainFamily);

    data.paymentAddr = pool.address;
    data.walletPoolLegacy = { connect: { id: pool.id } };
    data.status = OrderStatus.PENDING;

    const order = await this.repo.createOrder(data);
    await this.walletService.assignAddressToOrder(pool.id, order.id);

    return order;
  }

  async updateStatus(id: string, status: OrderStatus) {
    const order = await this.repo.findById(id);
    if (!order) throw new Error("Order not found");

    const updated = await this.repo.updateOrder(id, { status });

    if ([OrderStatus.COMPLETED, OrderStatus.EXPIRED, OrderStatus.FAILED].includes(status)) {
      if (order.walletPoolLegacy?.id) {
        await this.walletService.releaseAddress(order.walletPoolLegacy.id);
      }
    }

    return updated;
  }
}
