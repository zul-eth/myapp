// Client helpers untuk memanggil API Orders
import type { ListResponse, ItemResponse } from '@/types/http';
import type { OrderDTO, CreateOrderPayload, UpdateOrderPayload, ListOrdersQuery } from '@/types/order';

const base = '/api/orders';

export async function listOrders(params: ListOrdersQuery = {}): Promise<ListResponse<OrderDTO>> {
  const qsp = new URLSearchParams();
  if (params.q) qsp.set('q', params.q);
  if (params.status) qsp.set('status', params.status);
  if (params.page) qsp.set('page', String(params.page));
  if (params.limit) qsp.set('limit', String(params.limit));

  const res = await fetch(`${base}${qsp.toString() ? `?${qsp}` : ''}`, { cache: 'no-store' });
  if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.message || 'Gagal mengambil orders');
  return res.json();
}

export async function getOrder(id: string): Promise<ItemResponse<OrderDTO>> {
  const res = await fetch(`${base}/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.message || 'Gagal mengambil detail order');
  return res.json();
}

export async function createOrder(payload: CreateOrderPayload): Promise<ItemResponse<OrderDTO>> {
  const res = await fetch(base, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.message || 'Gagal membuat order');
  return res.json();
}

export async function updateOrder(id: string, payload: UpdateOrderPayload): Promise<ItemResponse<OrderDTO>> {
  const res = await fetch(`${base}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.message || 'Gagal memperbarui order');
  return res.json();
}
