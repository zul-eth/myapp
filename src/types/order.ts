import type { OrderStatus } from '@prisma/client';

export type OrderDTO = {
  id: string;
  coinToBuyId: string;
  buyNetworkId: string;
  payWithId: string;
  payNetworkId: string;
  amount: number;
  priceRate: number;
  receivingAddr: string;
  paymentAddr: string;
  paymentMemo?: string | null;
  txHash?: string | null;
  confirmations: number;
  status: OrderStatus;
  createdAt?: string;
  updatedAt?: string;
  expiresAt?: string | null;

  coinToBuy?: { id: string; symbol: string; name: string };
  buyNetwork?: { id: string; name: string };
  payWith?: { id: string; symbol: string; name: string };
  payNetwork?: { id: string; name: string };
};
