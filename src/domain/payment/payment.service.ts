import {
  PaymentStatus,
  ChainFamily,
  PrismaClient,
} from "@prisma/client";
import { PaymentRepository } from "./payment.repository";
import { WalletService } from "@/domain/wallet/wallet.service";

const prisma = new PrismaClient();

export class PaymentService {
  constructor(
    private readonly repo = new PaymentRepository(),
    private readonly wallet = new WalletService()
  ) {}

  /**
   * Membuat Payment untuk sebuah order:
   * - ambil requiredConfirmations dari Network
   * - alokasikan alamat invoice (HD pool lama)
   */
  async createForOrder(params: {
    orderId: string;
    payCoinId: string;
    payNetworkId: string;
  }) {
    const { orderId, payCoinId, payNetworkId } = params;

    const network = await prisma.network.findUnique({
      where: { id: payNetworkId },
      select: { id: true, family: true, requiredConfirmations: true },
    });
    if (!network) throw new Error("Network tidak ditemukan");

    // allocate address dari wallet service
    const addr = await this.wallet.getOrGenerateAddress(network.family as ChainFamily);

    const payment = await this.repo.create({
      orderId,
      coinId: payCoinId,
      networkId: payNetworkId,
      payToAddress: addr.address,
      payToMemo: null,
      confirmations: 0,
      requiredConfirmations: network.requiredConfirmations || 1,
      status: PaymentStatus.NOT_STARTED,
    });

    // simpan ke kolom Order.paymentAddr/Memo agar tampil di UI lama
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentAddr: payment.payToAddress,
        paymentMemo: payment.payToMemo,
      },
    });

    // tandai pool legacy terpakai bila pakai pool lama
    if (addr.id) {
      await this.wallet.assignAddressToOrder(addr.id, orderId);
    }

    return payment;
  }

  async setStatusByOrder(orderId: string, status: PaymentStatus) {
    return this.repo.setStatus(orderId, status);
  }

  async updateConfirmations(orderId: string, confirmations: number) {
    const p = await this.repo.setConfirmations(orderId, confirmations);
    if (confirmations >= (p.requiredConfirmations || 1)) {
      await this.repo.markConfirmed(orderId);
    }
    return this.repo.getByOrderId(orderId);
  }

  async markDetected(orderId: string, payload: {
    txHash: string;
    fromAddress?: string | null;
    toAddress?: string | null;
    amountRaw?: string | null;
    decimals?: number | null;
  }) {
    await this.repo.setDetectedTx(orderId, payload);
    await this.repo.setStatus(orderId, PaymentStatus.DETECTED);
    return this.repo.getByOrderId(orderId);
  }

  async getByOrderId(orderId: string) {
    return this.repo.getByOrderId(orderId);
  }
}
