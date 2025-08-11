import type { WalletPool } from '@/types/walletPool';

const base = '/api/wallet-pools';

export async function getWalletPools(params?: {
  chain?: 'evm' | 'tron' | 'solana';
  isUsed?: 'true' | 'false';
  q?: string;
  limit?: number;
}): Promise<WalletPool[]> {
  const usp = new URLSearchParams();
  if (params?.chain) usp.set('chain', params.chain);
  if (params?.isUsed) usp.set('isUsed', params.isUsed);
  if (params?.q) usp.set('q', params.q);
  if (params?.limit) usp.set('limit', String(params.limit));
  const res = await fetch(`${base}${usp.toString() ? `?${usp}` : ''}`, { cache: 'no-store' });
  if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.message || 'Gagal mengambil ledger');
  return res.json();
}

export async function deriveWallets(payload: { chain: 'evm' | 'tron' | 'solana'; count?: number }) {
  const res = await fetch(`${base}/derive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.message || 'Gagal generate alamat');
  return res.json() as Promise<{ message: string; wallets: WalletPool[] }>;
}

export async function updateWalletPool(
  id: string,
  payload: Partial<Pick<WalletPool, 'isUsed' | 'assignedOrder'>>
) {
  const res = await fetch(`${base}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.message || 'Gagal memperbarui ledger');
  return res.json() as Promise<{ message: string; wallet: WalletPool }>;
}

export async function deleteWalletPool(id: string) {
  const res = await fetch(`${base}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.message || 'Gagal menghapus baris ledger');
  return res.json() as Promise<{ message: string }>;
}
