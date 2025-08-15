import { Prisma, PrismaClient, PaymentStatus } from "@prisma/client";
const prisma = new PrismaClient();

export class PaymentRepository {
  async create(data: Prisma.PaymentUncheckedCreateInput) {
    return prisma.payment.create({ data });
  }

  async getByOrderId(orderId: string) {
    return prisma.payment.findUnique({
      where: { orderId },
      include: {
        coin: true,
        network: true,
        webhookEvents: { orderBy: { receivedAt: "desc" }, take: 10 },
      },
    });
  }

  async setStatus(orderId: string, status: PaymentStatus) {
    return prisma.payment.update({
      where: { orderId },
      data: { status },
    });
  }

  async setDetectedTx(orderId: string, params: {
    txHash: string;
    fromAddress?: string | null;
    toAddress?: string | null;
    amountRaw?: string | null;
    decimals?: number | null;
    assetType?: Prisma.AssetType | null;
    assetContract?: string | null;
  }) {
    const { txHash, ...rest } = params;
    return prisma.payment.update({
      where: { orderId },
      data: {
        txHash,
        detectedAt: new Date(),
        ...rest,
      },
    });
  }

  async setConfirmations(orderId: string, confirmations: number) {
    return prisma.payment.update({
      where: { orderId },
      data: { confirmations },
    });
  }

  async markConfirmed(orderId: string) {
    return prisma.payment.update({
      where: { orderId },
      data: { status: PaymentStatus.CONFIRMED, confirmedAt: new Date() },
    });
  }

  async attachWebhookEvent(paymentId: string, eventId: string) {
    return prisma.payment.update({
      where: { id: paymentId },
      data: { lastWebhookEventId: eventId },
    });
  }
}
