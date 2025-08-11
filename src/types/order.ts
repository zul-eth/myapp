import type { OrderStatus } from '@prisma/client';

export type OrderDTO = {
  id: string;

  // relations (ids)
  coinToBuyId: string;
  buyNetworkId: string;
  payWithId: string;
  payNetworkId: string;

  // amounts & pricing
  amount: number;         // jumlah coin yang dibeli (coinToBuy)
  priceRate: number;      // harga 1 coinToBuy dalam payWith

  // addresses
  receivingAddr: string;  // alamat tujuan user untuk menerima coin yang dibeli
  paymentAddr: string;    // alamat yang harus dibayar user (dari wallet pool)
  paymentMemo?: string | null;

  // chain settlement
  txHash?: string | null;
  confirmations: number;

  // status & lifecycle
  status: OrderStatus;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;

  // optional includes
  coinToBuy?: { id: string; symbol: string; name: string; logoUrl?: string | null };
  buyNetwork?: { id: string; name: string; logoUrl?: string | null };
  payWith?: { id: string; symbol: string; name: string; logoUrl?: string | null };
  payNetwork?: { id: string; name: string; logoUrl?: string | null };
};

export type CreateOrderPayload = {
  coinToBuyId: string;
  buyNetworkId: string;
  payWithId: string;
  payNetworkId: string;
  amount: number;
  receivingAddr: string;
};

export type UpdateOrderPayload = {
  status?: OrderStatus;
  txHash?: string | null;
  confirmations?: number;
};

export type ListOrdersQuery = {
  q?: string;
  status?: OrderStatus | '';
  page?: number;
  limit?: number;
};
