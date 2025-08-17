import { prisma } from "@/lib/prisma";
import { OrderRepositoryPrisma } from "./order.repository";
import { WalletService } from "@/domain/wallet/wallet.service";
import { ExchangeRateService } from "@/domain/exchange-rate/exchange-rate.service";
import { AssetType, MemoKind, OrderStatus } from "@prisma/client";
import { OrderCreateFlexibleSchema, OrderCreateStrictSchema } from "@/lib/validation/order";
import { z } from "zod";

// util sederhana
const DEFAULT_EXPIRE_MINUTES = 15;
const isUuid = (s?: string | null) => !!s && z.string().uuid().safeParse(s).success;
const up = (s?: string | null) => (typeof s === "string" ? s.trim().toUpperCase() : undefined);
const minutesFromNow = (m: number) => new Date(Date.now() + m * 60_000);
const rand = (len: number, abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789") =>
  Array.from({ length: len }, () => abc[Math.floor(Math.random() * abc.length)]).join("");
const randomTag6 = () => String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
const randomText8 = () => rand(8);

type FlexibleOrderInput = z.infer<typeof OrderCreateFlexibleSchema>;
type StrictOrderInput   = z.infer<typeof OrderCreateStrictSchema>;

/**
 * Konstruktor DI disesuaikan dgn ApplicationManager:
 *   new OrderService(orderRepo, rateService, walletService)
 * (rateService tidak wajib dipakai di sini, tapi kita terima agar kompatibel)
 */
export class OrderService {
  constructor(
    private readonly orders: OrderRepositoryPrisma,
    private readonly _rates: ExchangeRateService,     // keep untuk kompatibilitas
    private readonly wallets: WalletService
  ) {}

  listAll() { return this.orders.listAll(); }
  getById(id: string) { return this.orders.getById(id); }

  // ---------- CREATE (FLEXIBLE) ----------
  async createFlexible(input: FlexibleOrderInput) {
    const strict = await this.toStrict(input);
    if (!strict.expiresInMinutes) strict.expiresInMinutes = DEFAULT_EXPIRE_MINUTES;
    return this.create(strict);
  }

  // ---------- CREATE (STRICT) ----------
  async create(input: StrictOrderInput) {
    // PaymentOption aktif
    const payOption = await prisma.paymentOption.findFirst({
      where: { coinId: input.payWithId, networkId: input.payNetworkId, isActive: true },
      include: { coin: true, network: true },
    });
    if (!payOption) throw new Error("Payment option tidak tersedia/aktif");

    // CoinNetwork aktif
    const buyCN = await prisma.coinNetwork.findFirst({ where: { coinId: input.coinToBuyId, networkId: input.buyNetworkId, isActive: true }});
    if (!buyCN) throw new Error("CoinNetwork (buy) tidak aktif/valid");
    const payCN = await prisma.coinNetwork.findFirst({ where: { coinId: input.payWithId, networkId: input.payNetworkId, isActive: true }});
    if (!payCN) throw new Error("CoinNetwork (pay) tidak aktif/valid");

    // Rate
    const rateRow = await prisma.exchangeRate.findUnique({
      where: {
        buyCoinId_buyNetworkId_payCoinId_payNetworkId: {
          buyCoinId: input.coinToBuyId,
          buyNetworkId: input.buyNetworkId,
          payCoinId: input.payWithId,
          payNetworkId: input.payNetworkId,
        },
      },
    });
    if (!rateRow) throw new Error("Exchange rate tidak ditemukan untuk pasangan ini");
    const priceRate = rateRow.rate;

    // Required confirmations
    const payNetwork = await prisma.network.findUnique({ where: { id: input.payNetworkId } });
    if (!payNetwork) throw new Error("Network pembayaran tidak ditemukan");

    // Memo
    let paymentMemo: string | null = null;
    switch (payCN.memoKind) {
      case MemoKind.XRP_TAG: paymentMemo = randomTag6(); break;
      case MemoKind.EOS_TEXT:
      case MemoKind.TON_TEXT:
      case MemoKind.OTHER: paymentMemo = randomText8(); break;
      default: paymentMemo = null;
    }

    // Address dari pool / derive baru
    const pool = await this.wallets.allocateForNetwork(input.payNetworkId);
    const expiresAt = minutesFromNow(input.expiresInMinutes ?? DEFAULT_EXPIRE_MINUTES);

    // Transaksi atomik
    const created = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          coinToBuyId: input.coinToBuyId,
          buyNetworkId: input.buyNetworkId,
          payWithId: input.payWithId,
          payNetworkId: input.payNetworkId,
          amount: input.amount,
          priceRate,
          receivingAddr: input.receivingAddr,
          receivingMemo: input.receivingMemo ?? null,
          paymentAddr: pool.address,
          paymentMemo,
          expiresAt,
          status: "WAITING_PAYMENT",
        },
      });

      await tx.walletPoolLegacy.update({
        where: { id: pool.id },
        data: { isUsed: true, assignedOrderId: order.id, networkId: input.payNetworkId },
      });

      await tx.payment.create({
        data: {
          orderId: order.id,
          coinId: input.payWithId,
          networkId: input.payNetworkId,
          payToAddress: pool.address,
          payToMemo: paymentMemo,
          requiredConfirmations: payNetwork.requiredConfirmations ?? 1,
          assetType: payCN.assetType as AssetType,
          decimals: payCN.decimals ?? 18,
          assetContract: payCN.contractAddress ?? null,
        },
      });

      return order;
    });

    return this.getById(created.id);
  }

  // ---------- STATUS / RELEASE ----------
  private async releaseAddress(orderId: string) {
    await this.wallets.releaseForOrder(orderId);
  }

  async cancel(id: string) {
    const cur = await this.orders.getById(id);
    if (!cur) throw new Error("Order tidak ditemukan");
    if (["COMPLETED", "CANCELED", "FAILED", "EXPIRED"].includes(cur.status)) return cur;

    await prisma.order.update({ where: { id }, data: { status: "CANCELED" } });
    await this.releaseAddress(id);
    return this.getById(id);
  }

  async updateStatus(id: string, status: OrderStatus) {
    await prisma.order.update({ where: { id }, data: { status } });
    if (["COMPLETED", "FAILED", "CANCELED", "EXPIRED"].includes(status)) {
      await this.releaseAddress(id);
    }
    return this.getById(id);
  }

  // ---------- REGENERATE INVOICE ----------
  async regenerateInvoice(orderId: string) {
    const cur = await this.getById(orderId);
    if (!cur) throw new Error("Order tidak ditemukan");
    if (!["FAILED", "CANCELED", "EXPIRED"].includes(cur.status)) {
      throw new Error("Order belum selesai/invalid untuk regenerate");
    }

    await this.releaseAddress(orderId);
    const pool = await this.wallets.allocateForNetwork(cur.payNetworkId);

    const payCN = await prisma.coinNetwork.findFirst({
      where: { coinId: cur.payWithId, networkId: cur.payNetworkId, isActive: true },
    });
    if (!payCN) throw new Error("CoinNetwork (pay) tidak aktif/valid");

    let paymentMemo: string | null = null;
    switch (payCN.memoKind) {
      case "XRP_TAG": paymentMemo = randomTag6(); break;
      case "EOS_TEXT":
      case "TON_TEXT":
      case "OTHER": paymentMemo = randomText8(); break;
      default: paymentMemo = null;
    }

    const expiresAt = minutesFromNow(DEFAULT_EXPIRE_MINUTES);

    await prisma.$transaction(async (tx) => {
      await tx.walletPoolLegacy.update({
        where: { id: pool.id },
        data: { isUsed: true, assignedOrderId: cur.id, networkId: cur.payNetworkId },
      });

      await tx.order.update({
        where: { id: cur.id },
        data: {
          paymentAddr: pool.address,
          paymentMemo,
          status: "WAITING_PAYMENT",
          expiresAt,
        },
      });

      await tx.payment.update({
        where: { orderId: cur.id },
        data: {
          payToAddress: pool.address,
          payToMemo: paymentMemo,
          status: "NOT_STARTED",
          txHash: null,
          fromAddress: null,
          toAddress: null,
          amountRaw: null,
          confirmations: 0,
          detectedAt: null,
          confirmedAt: null,
          lastWebhookEventId: null,
          verificationSource: null,
          notes: null,
        },
      });
    });

    return this.getById(orderId);
  }

  // ---------- EXPIRE JOB (15 menit) ----------
  async expireOverdue() {
    const now = new Date();
    const stale = await prisma.order.findMany({
      where: {
        status: { in: ["PENDING", "WAITING_PAYMENT"] },
        OR: [
          { expiresAt: { lt: now } },
          { AND: [ { expiresAt: null }, { createdAt: { lt: new Date(now.getTime() - DEFAULT_EXPIRE_MINUTES * 60 * 1000) } } ] },
        ],
      },
      select: { id: true },
    });

    for (const o of stale) {
      await this.updateStatus(o.id, "EXPIRED");
    }
    return { expired: stale.length };
  }

  // ---------- FLEX → STRICT ----------
  private async toStrict(input: FlexibleOrderInput): Promise<StrictOrderInput> {
    const coinToBuyId = await this.resolveCoinId({ id: input.coinToBuyId as any, symbol: input.coinToBuySymbol });
    const buyNetworkId = await this.resolveNetworkId({ id: input.buyNetworkId as any, symbol: input.buyNetworkSymbol, name: input.buyNetworkName });

    let payWithId: string;
    let payNetworkId: string;
    if (input.paymentOptionId) {
      ({ payWithId, payNetworkId } = await this.resolvePayByPaymentOptionId(input.paymentOptionId));
    } else if (input.payPair) {
      ({ payWithId, payNetworkId } = await this.resolvePayByPair(input.payPair));
    } else {
      payWithId = await this.resolveCoinId({ id: input.payWithId as any, symbol: input.payWithSymbol });
      payNetworkId = await this.resolveNetworkId({ id: input.payNetworkId as any, symbol: input.payNetworkSymbol, name: input.payNetworkName });
    }

    return OrderCreateStrictSchema.parse({
      coinToBuyId, buyNetworkId, payWithId, payNetworkId,
      amount: input.amount,
      receivingAddr: input.receivingAddr,
      receivingMemo: input.receivingMemo,
      expiresInMinutes: input.expiresInMinutes ?? DEFAULT_EXPIRE_MINUTES,
    });
  }

  private async resolveCoinId({ id, symbol }: { id?: string; symbol?: string | null }) {
    if (id && isUuid(id)) return id;
    const sym = (symbol ?? id)?.toString();
    if (sym) {
      const coin = await prisma.coin.findUnique({ where: { symbol: up(sym)! } });
      if (!coin) throw new Error(`Coin dengan symbol '${sym}' tidak ditemukan`);
      return coin.id;
    }
    throw new Error("coin tidak valid");
  }

  private async resolveNetworkId({ id, symbol, name }: { id?: string; symbol?: string | null; name?: string | null }) {
    if (id && isUuid(id)) return id;
    if (name) {
      const byName = await prisma.network.findUnique({ where: { name } });
      if (byName) return byName.id;
    }
    const sym = (symbol ?? id)?.toString();
    if (sym) {
      const n = await prisma.network.findFirst({ where: { symbol: up(sym)!, isActive: true } });
      if (n) return n.id;
    }
    throw new Error("network tidak valid");
  }

  private async resolvePayByPaymentOptionId(paymentOptionId: string) {
    const po = await prisma.paymentOption.findUnique({
      where: { id: paymentOptionId }, include: { coin: true, network: true }
    });
    if (!po || !po.isActive) throw new Error("paymentOption tidak ditemukan/aktif");
    return { payWithId: po.coinId, payNetworkId: po.networkId };
  }

  private async resolvePayByPair(payPair: string) {
    const [coinSym, netSymRaw] = payPair.split(":");
    const coin = await prisma.coin.findUnique({ where: { symbol: up(coinSym)! } });
    if (!coin) throw new Error(`Coin '${coinSym}' tidak ditemukan`);
    const byName = await prisma.network.findUnique({ where: { name: netSymRaw } });
    const net = byName ?? (await prisma.network.findFirst({ where: { symbol: up(netSymRaw)!, isActive: true } }));
    if (!net) throw new Error(`Network '${netSymRaw}' tidak ditemukan`);
    const po = await prisma.paymentOption.findFirst({ where: { coinId: coin.id, networkId: net.id, isActive: true } });
    if (!po) throw new Error(`Payment option ${coin.symbol}:${net.symbol ?? net.name} tidak tersedia`);
    return { payWithId: coin.id, payNetworkId: net.id };
  }
}
