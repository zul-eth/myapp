// src/lib/api/rates.ts
import type { ExchangeRate } from '@/types/exchangeRate';

const baseUrl = '/api/rates';

export async function getRates(params?: { q?: string; active?: 'true' | 'false' }) {
  const usp = new URLSearchParams();
  if (params?.q) usp.set('q', params.q);
  if (params?.active) usp.set('active', params.active);
  const res = await fetch(`${baseUrl}${usp.toString() ? `?${usp}` : ''}`, { cache: 'no-store' });
  if (!res.ok) throw new Error((await res.json().catch(()=>({})))?.message || 'Gagal mengambil rates');
  return res.json() as Promise<ExchangeRate[]>;
}

export async function createRate(input: {
  buyCoinId: string;
  buyNetworkId: string;
  payCoinId: string;
  payNetworkId: string;
  rate: number;
  updatedBy?: string;
}) {
  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error((await res.json().catch(()=>({})))?.message || 'Gagal menambah rate');
  return res.json() as Promise<{ message: string; rate: ExchangeRate }>;
}

export async function updateRate(
  id: string,
  payload: Partial<Pick<ExchangeRate, 'rate' | 'isActive'>> & { updatedBy?: string }
) {
  const res = await fetch(`${baseUrl}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await res.json().catch(()=>({})))?.message || 'Gagal memperbarui rate');
  return res.json() as Promise<{ message: string; rate: ExchangeRate }>;
}

export async function deleteRate(id: string) {
  const res = await fetch(`${baseUrl}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error((await res.json().catch(()=>({})))?.message || 'Gagal menghapus rate');
  return res.json() as Promise<{ message: string }>;
}
