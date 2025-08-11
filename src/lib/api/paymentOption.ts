// src/lib/api/paymentOption.ts
import type { PaymentOption } from '@/types/paymentOption';

const baseUrl = '/api/payment-options';

export async function getPaymentOptions(): Promise<PaymentOption[]> {
  const res = await fetch(baseUrl, { cache: 'no-store' });
  if (!res.ok) throw new Error('Gagal mengambil payment options');
  return res.json();
}

export async function createPaymentOption(coinId: string, networkId: string) {
  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ coinId, networkId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || 'Gagal menambah payment option');
  }
  return res.json() as Promise<{ message: string; paymentOption: PaymentOption }>;
}

export async function setPaymentOptionActive(id: string, isActive: boolean) {
  const res = await fetch(`${baseUrl}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isActive }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || 'Gagal memperbarui status');
  }
  return res.json() as Promise<{ message: string; paymentOption: PaymentOption }>;
}

export async function deletePaymentOption(id: string) {
  const res = await fetch(`${baseUrl}/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || 'Gagal menghapus payment option');
  }
  return res.json() as Promise<{ message: string }>;
}
