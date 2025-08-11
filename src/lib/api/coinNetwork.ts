// src/lib/api/coinNetwork.ts
import { CoinNetworkRelation } from '@/types/coinNetwork';

const baseUrl = '/api/coin-network';

export async function getRelations(): Promise<CoinNetworkRelation[]> {
  const res = await fetch(baseUrl, { cache: 'no-store' });
  if (!res.ok) throw new Error('Gagal mengambil data relasi');
  return res.json();
}

export async function createRelation(coinId: string, networkId: string) {
  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ coinId, networkId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || 'Gagal membuat relasi');
  }
  return res.json() as Promise<{ message: string; relation: CoinNetworkRelation }>;
}

export async function toggleRelation(id: string, isActive: boolean) {
  const res = await fetch(`${baseUrl}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isActive }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || 'Gagal memperbarui relasi');
  }
  return res.json() as Promise<{ message: string; relation: CoinNetworkRelation }>;
}

export async function deleteRelation(id: string) {
  const res = await fetch(`${baseUrl}/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || 'Gagal menghapus relasi');
  }
  return res.json() as Promise<{ message: string }>;
}
