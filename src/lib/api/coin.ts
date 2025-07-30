import { Coin } from '@/types/coin';

export async function getCoins(): Promise<Coin[]> {
  const res = await fetch('/api/coins');
  if (!res.ok) throw new Error('Failed to fetch coins');
  return res.json();
}

export async function createCoin(data: Omit<Coin, 'id'>) {
  const res = await fetch('/api/coins', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateCoin(id: string, data: Partial<Coin>) {
  const res = await fetch(`/api/coins/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteCoin(id: string) {
  const res = await fetch(`/api/coins/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const msg = await res.json();
    throw new Error(msg.message || 'Gagal menghapus coin');
  }

  return res.json();
}