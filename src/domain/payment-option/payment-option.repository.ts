import { prisma } from "@/lib/prisma";
import { PaymentOption } from "@prisma/client";

export class PaymentOptionRepositoryPrisma {
  async list(): Promise<PaymentOption[]> {
    return prisma.paymentOption.findMany({ where: { isActive: true } });
  }
}
