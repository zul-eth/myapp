import { prisma } from "@/lib/prisma";
import { BaseRepository } from "@/domain/common/base.repository";

export class PaymentOptionRepositoryPrisma extends BaseRepository<typeof prisma.paymentOption> {
  constructor() {
    super(prisma.paymentOption);
  }

  async listAll() {
    return prisma.paymentOption.findMany({
      include: { coin: true, network: true },
      orderBy: { createdAt: "desc" }
    });
  }

  async createPaymentOption(data: { coinId: string; networkId: string }) {
    if (!data.coinId || !data.networkId) throw new Error("Coin dan Network wajib diisi");

    const exists = await prisma.paymentOption.findFirst({
      where: { coinId: data.coinId, networkId: data.networkId }
    });
    if (exists) throw new Error("Payment option ini sudah ada");

    return prisma.paymentOption.create({ data });
  }

  async updatePaymentOption(id: string, data: { isActive?: boolean }) {
    return prisma.paymentOption.update({ where: { id }, data });
  }

  async deletePaymentOption(id: string) {
    return prisma.paymentOption.delete({ where: { id } });
  }
}
