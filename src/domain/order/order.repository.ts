import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

export type CreateOrderDTO = {
  coinToBuyId: string;
  buyNetworkId: string;
  payWithId: string;
  payNetworkId: string;
  amount: number;
  priceRate: number;
  receivingAddr: string;
  receivingMemo?: string | null;
  paymentAddr: string;
  paymentMemo?: string | null;
  expiresAt?: Date | null;
};

export class OrderRepositoryPrisma {
  listAll() {
    return prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        coinToBuy: true,
        buyNetwork: true,
        payWith: true,
        payNetwork: true,
        payment: true,
      },
    });
  }

  getById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        coinToBuy: true,
        buyNetwork: true,
        payWith: true,
        payNetwork: true,
        payment: true,
      },
    });
  }

  create(data: CreateOrderDTO) {
    return prisma.order.create({
      data: {
        coinToBuyId: data.coinToBuyId,
        buyNetworkId: data.buyNetworkId,
        payWithId: data.payWithId,
        payNetworkId: data.payNetworkId,
        amount: data.amount,
        priceRate: data.priceRate,
        receivingAddr: data.receivingAddr,
        receivingMemo: data.receivingMemo ?? null,
        paymentAddr: data.paymentAddr,
        paymentMemo: data.paymentMemo ?? null,
        expiresAt: data.expiresAt ?? null,
        status: "WAITING_PAYMENT",
      },
    });
  }

  updateStatus(id: string, status: OrderStatus) {
    return prisma.order.update({ where: { id }, data: { status } });
  }

  cancel(id: string) {
    return prisma.order.update({ where: { id }, data: { status: "CANCELED" } });
  }

  markExpired(id: string) {
    return prisma.order.update({ where: { id }, data: { status: "EXPIRED" } });
  }

  setPayout(id: string, payoutHash: string) {
    return prisma.order.update({ where: { id }, data: { payoutHash, payoutAt: new Date() } });
  }
}
