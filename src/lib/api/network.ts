// src/lib/api/network.ts
import { Network } from '@/types/network';

const baseUrl = '/api/networks';

export async function getNetworks(): Promise<Network[]> {
  const res = await fetch(baseUrl);
  if (!res.ok) throw new Error('Gagal mengambil data jaringan');
  return res.json();
}

export async function createNetwork(data: Partial<Network>): Promise<Network> {
  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error('Gagal membuat jaringan');
  const json = await res.json();
  return json.network ?? json;
}

export async function updateNetwork(id: string, data: Partial<Network>): Promise<Network> {
  const res = await fetch(`${baseUrl}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error('Gagal memperbarui jaringan');
  const json = await res.json();
  return json.network ?? json;
}

export async function deleteNetwork(id: string): Promise<{ message: string }> {
  const res = await fetch(`${baseUrl}/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) throw new Error('Gagal menghapus jaringan');
  return res.json();
}