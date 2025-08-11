// src/lib/api/orders.ts
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

  // relasi yang biasanya disertakan include: true
  coinToBuy?: any;
  buyNetwork?: any;
  payWith?: any;
  payNetwork?: any;
};

export async function listOrders(params?: {
  status?: OrderStatus;
  q?: string;
  limit?: number;
}) {
  const sp = new URLSearchParams();
  if (params?.status) sp.set('status', params.status);
  if (params?.q) sp.set('q', params.q);
  if (params?.limit) sp.set('limit', String(params.limit));

  const res = await fetch(`/api/orders${sp.toString() ? `?${sp.toString()}` : ''}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.message || 'Gagal memuat orders');
  return (await res.json()) as Order[];
}

export async function createOrder(payload: {
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
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.message || 'Gagal membuat order');
  return (await res.json()) as { message: string; order: Order };
}

export async function getOrderById(id: string) {
  const res = await fetch(`/api/orders/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.message || 'Order tidak ditemukan');
  return (await res.json()) as Order;
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const res = await fetch(`/api/orders/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.message || 'Gagal update status');
  return (await res.json()) as { message: string; order: Order };
}