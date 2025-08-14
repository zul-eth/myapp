import { Result } from "@/lib/result";
import { IOrderRepository } from "./order.repository";
import { ValidationError } from "@/lib/errors";
import { ExchangeRateService } from "@/domain/exchange-rate/exchange-rate.service";
import { WalletService } from "@/domain/wallet/wallet.service";
import { OrderStatus } from "@prisma/client";

export interface CreateOrderDTO {
  coinToBuyId: string;
  buyNetworkId: string;
  payWithId: string;
  payNetworkId: string;
  amount: number;
  receivingAddr: string;
  receivingMemo?: string;
}

export class OrderService {
  constructor(
    private readonly repo: IOrderRepository,
    private readonly rates: ExchangeRateService,
    private readonly wallets: WalletService
  ) {}

  async list() {
    return Result.ok(await this.repo.list());
  }

  async get(id: string) {
    const order = await this.repo.get(id);
    if (!order) return Result.err(new ValidationError("Order not found"));
    return Result.ok(order);
  }

  async create(dto: CreateOrderDTO) {
    if (!dto.coinToBuyId || !dto.buyNetworkId || !dto.payWithId || !dto.payNetworkId) {
      return Result.err(new ValidationError("All coin/network fields are required"));
    }

    // Ambil rate dari ExchangeRate
    const rate = await this.rates.getLatest({
      buyCoinId: dto.coinToBuyId,
      buyNetworkId: dto.buyNetworkId,
      payCoinId: dto.payWithId,
      payNetworkId: dto.payNetworkId
    });
    if (!rate) {
      return Result.err(new ValidationError("Rate not found for this pair"));
    }

    // Ambil alamat pembayaran (paymentAddr)
    const payAddr = await this.wallets.getPaymentAddress(dto.payWithId, dto.payNetworkId);
    if (!payAddr.ok) return Result.err(payAddr.error);

    const order = await this.repo.create({
      id: "",
      coinToBuyId: dto.coinToBuyId,
      buyNetworkId: dto.buyNetworkId,
      payWithId: dto.payWithId,
      payNetworkId: dto.payNetworkId,
      amount: dto.amount,
      receivedAmount: 0,
      priceRate: rate.rate,
      receivingAddr: dto.receivingAddr,
      receivingMemo: dto.receivingMemo || null,
      paymentAddr: payAddr.value,
      paymentMemo: null,
      txHash: null,
      confirmations: 0,
      status: OrderStatus.PENDING,
      payoutHash: null,
      payoutAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: null
    });

    return Result.ok(order);
  }
}
