// src/lib/api/walletPool.ts
import type { WalletPool } from '@/types/walletPool';

const baseUrl = '/api/wallet-pools';

export async function getWalletPools(params?: {
  coinId?: string;
  networkId?: string;
  isUsed?: 'true' | 'false';
  q?: string;
  limit?: number;
}): Promise<WalletPool[]> {
  const usp = new URLSearchParams();
  if (params?.coinId) usp.set('coinId', params.coinId);
  if (params?.networkId) usp.set('networkId', params.networkId);
  if (params?.isUsed) usp.set('isUsed', params.isUsed);
  if (params?.q) usp.set('q', params.q);
  if (params?.limit) usp.set('limit', String(params.limit));

  const res = await fetch(`${baseUrl}${usp.toString() ? `?${usp}` : ''}`, { cache: 'no-store' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || 'Gagal mengambil wallet pool');
  }
  return res.json();
}

export async function createWalletPool(payload: {
  coinId: string;
  networkId: string;
  address: string;
  xpub?: string;
}) {
  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || 'Gagal menambah wallet');
  }
  return res.json() as Promise<{ message: string; wallet: WalletPool }>;
}

export async function updateWalletPool(
  id: string,
  payload: Partial<Pick<WalletPool, 'address' | 'xpub' | 'isUsed' | 'assignedOrder'>>
) {
  const res = await fetch(`${baseUrl}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || 'Gagal memperbarui wallet');
  }
  return res.json() as Promise<{ message: string; wallet: WalletPool }>;
}

export async function deleteWalletPool(id: string) {
  const res = await fetch(`${baseUrl}/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || 'Gagal menghapus wallet');
  }
  return res.json() as Promise<{ message: string }>;
}

// (Opsional) allocate 1 wallet untuk order tertentu
export async function allocateWallet(payload: {
  coinId: string;
  networkId: string;
  orderId?: string;
}) {
  const res = await fetch(`${baseUrl}/allocate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || 'Gagal mengalokasikan wallet');
  }
  return res.json() as Promise<{ message: string; wallet: WalletPool }>;
}
