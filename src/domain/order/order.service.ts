import { OrderRepositoryPrisma } from "./order.repository";
import { ExchangeRateService } from "../exchange-rate/exchange-rate.service";
import { WalletService } from "../wallet/wallet.service";
import { ChainFamily, OrderStatus, Prisma } from "@prisma/client";

type CreateOrderInput =
  | ({
      pairId: string;
      amount: number;
      receivingAddr: string;
      receivingMemo?: string | null;
    } & Partial<{
      expiresAt: Date;
    }>)
  | ({
      buyCoinId: string;
      buyNetworkId: string;
      payWithId: string;
      payNetworkId: string;
      amount: number;
      receivingAddr: string;
      receivingMemo?: string | null;
    } & Partial<{
      expiresAt: Date;
    }>);

export class OrderService {
  constructor(
    private readonly repo: OrderRepositoryPrisma,
    private readonly rateService: ExchangeRateService,
    private readonly walletService: WalletService
  ) {}

  /**
   * Buat order dengan rate yang diambil langsung dari ExchangeRate.
   * - Menimpa priceRate yang dikirim klien
   * - Alokasikan payment address sesuai family jaringan bayar
   * - Status awal: WAITING_PAYMENT
   */
  async create(input: CreateOrderInput) {
    // 1) Resolve pair
    let pair:
      | Awaited<ReturnType<ExchangeRateService["getById"]>>
      | Awaited<ReturnType<ExchangeRateService["getLatest"]>>
      | null = null;

    if ("pairId" in input) {
      pair = await this.rateService.getById(input.pairId);
    } else {
      pair = await this.rateService.getLatest({
        buyCoinId: input.buyCoinId,
        buyNetworkId: input.buyNetworkId,
        payCoinId: input.payWithId,
        payNetworkId: input.payNetworkId,
      });
    }
    if (!pair) throw new Error("Exchange rate/pair tidak ditemukan");

    // 2) Validasi jumlah & rate
    const amount = Number(("amount" in input && input.amount) || 0);
    if (!amount || amount <= 0) throw new Error("amount harus > 0");

    const priceRate = Number(pair.rate);
    if (!priceRate || priceRate <= 0) throw new Error("Rate tidak valid");

    // 3) Alokasi alamat pembayaran
    const chainFamily: ChainFamily = pair.payNetwork.family;
    const wallet = await this.walletService.getOrGenerateAddress(chainFamily);
    
    const defaultExpires = new Date(Date.now() + 15 * 60 * 1000);
    const expiresAt = "expiresAt" in input && input.expiresAt ? input.expiresAt : defaultExpires;

    // 4) Simpan order
    const data: Prisma.OrderUncheckedCreateInput = {
      coinToBuyId: pair.buyCoinId,
      buyNetworkId: pair.buyNetworkId,
      payWithId: pair.payCoinId,
      payNetworkId: pair.payNetworkId,
      amount,
      priceRate,
      status: OrderStatus.WAITING_PAYMENT,
      receivingAddr: input.receivingAddr,
      receivingMemo: input.receivingMemo ?? null,
      paymentAddr: wallet.address,
      paymentMemo: null,
      expiresAt, // ← gunakan default 15 menit jika tidak disuplai
    };

    const order = await this.repo.createOrder(data);

    // Tandai wallet dipakai oleh order ini
    if (wallet.id) {
      await this.walletService.assignAddressToOrder(wallet.id, order.id);
    }

    return this.repo.findById(order.id);
  }

  /**
   * Update order. Jika pasangan/rate berubah → ambil rate terbaru.
   * Rilis alamat saat status terminal.
   */
  async update(
    id: string,
    patch: Partial<Prisma.OrderUncheckedUpdateInput> & { pairId?: string }
  ) {
    const order = await this.repo.findById(id);
    if (!order) throw new Error("Order tidak ditemukan");

    // pairId baru → set pasangan & priceRate sesuai pair tsb
    if (patch.pairId && typeof patch.pairId === "string") {
      const pair = await this.rateService.getById(patch.pairId);
      if (!pair) throw new Error("Exchange rate/pair tidak ditemukan");
      patch.coinToBuyId = pair.buyCoinId;
      patch.buyNetworkId = pair.buyNetworkId;
      patch.payWithId = pair.payCoinId;
      patch.payNetworkId = pair.payNetworkId;
      patch.priceRate = pair.rate;
    }

    // Jika komponen pasangan berubah → re-price pakai latest
    const fields = ["coinToBuyId", "buyNetworkId", "payWithId", "payNetworkId"] as const;
    if (fields.some((k) => k in patch)) {
      const pair = await this.rateService.getLatest({
        buyCoinId: String(patch.coinToBuyId ?? order.coinToBuyId),
        buyNetworkId: String(patch.buyNetworkId ?? order.buyNetworkId),
        payCoinId: String(patch.payWithId ?? order.payWithId),
        payNetworkId: String(patch.payNetworkId ?? order.payNetworkId),
      });
      if (!pair) throw new Error("Exchange rate/pair tidak ditemukan");
      patch.priceRate = pair.rate;
    }

    const updated = await this.repo.updateOrder(id, patch);

    // Rilis alamat bila status terminal
    if (
      "status" in patch &&
      [OrderStatus.COMPLETED, OrderStatus.EXPIRED, OrderStatus.FAILED].includes(
        patch.status as OrderStatus
      )
    ) {
      if (order.walletPoolLegacy?.id) {
        await this.walletService.releaseAddress(order.walletPoolLegacy.id);
      }
    }

    return this.repo.findById(updated.id);
  }

  async setStatus(id: string, status: OrderStatus) {
    const order = await this.repo.findById(id);
    if (!order) throw new Error("Order tidak ditemukan");

    const updated = await this.repo.updateOrder(id, { status });

    if ([OrderStatus.COMPLETED, OrderStatus.EXPIRED, OrderStatus.FAILED].includes(status)) {
      if (order.walletPoolLegacy?.id) {
        await this.walletService.releaseAddress(order.walletPoolLegacy.id);
      }
    }
    return updated;
  }

  async get(id: string) {
    const o = await this.repo.findById(id);
    if (!o) throw new Error("Order tidak ditemukan");
    return o;
  }

  async list(params?: { status?: OrderStatus; search?: string; skip?: number; take?: number }) {
    return this.repo.listAll(params);
  }
}
