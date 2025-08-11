// src/lib/api/order.ts
import type { OrderStatus } from '@prisma/client';

export type Order = {
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

export async function createOrder(input: {
  coinToBuyId: string;
  buyNetworkId: string;
  payWithId: string;
  payNetworkId: string;
  amount: number;
  receivingAddr: string;
}) {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error((await res.json().catch(()=>({})))?.message || 'Gagal membuat order');
  return res.json() as Promise<{ message: string; order: Order }>;
}

export async function getOrderById(id: string) {
  const res = await fetch(`/api/orders/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error((await res.json().catch(()=>({})))?.message || 'Order tidak ditemukan');
  return res.json() as Promise<Order>;
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const res = await fetch(`/api/orders/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error((await res.json().catch(()=>({})))?.message || 'Gagal update status');
  return res.json() as Promise<{ message: string; order: Order }>;
}
