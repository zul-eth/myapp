import { prisma } from "@/lib/prisma";
import { AssetType } from "@prisma/client";

export type CreatePaymentDTO = {
  orderId: string;
  coinId: string;
  networkId: string;
  payToAddress: string;
  payToMemo?: string | null;
  requiredConfirmations: number;
  assetType?: AssetType | null;
  decimals?: number | null;
  assetContract?: string | null;
};

export class PaymentRepositoryPrisma {
  create(data: CreatePaymentDTO) {
    return prisma.payment.create({
      data: {
        orderId: data.orderId,
        coinId: data.coinId,
        networkId: data.networkId,
        payToAddress: data.payToAddress,
        payToMemo: data.payToMemo ?? null,
        requiredConfirmations: data.requiredConfirmations,
        assetType: data.assetType ?? null,
        decimals: data.decimals ?? null,
        assetContract: data.assetContract ?? null,
      },
    });
  }
  deleteByOrderId(orderId: string) {
    return prisma.payment.delete({ where: { orderId } });
  }
}
