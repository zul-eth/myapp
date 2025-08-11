// UI helpers khusus Order
import type { OrderStatus } from '@prisma/client';

export const STATUS_OPTIONS: OrderStatus[] = [
  'PENDING',
  'WAITING_PAYMENT',
  'UNDERPAID',
  'WAITING_CONFIRMATION',
  'CONFIRMED',
  'COMPLETED',
  'EXPIRED',
  'FAILED',
];

export function statusLabel(s: OrderStatus) {
  switch (s) {
    case 'PENDING': return 'Baru Dibuat';
    case 'WAITING_PAYMENT': return 'Menunggu Pembayaran';
    case 'UNDERPAID': return 'Kurang Bayar';
    case 'WAITING_CONFIRMATION': return 'Menunggu Konfirmasi';
    case 'CONFIRMED': return 'Terkonfirmasi';
    case 'COMPLETED': return 'Selesai';
    case 'EXPIRED': return 'Kadaluarsa';
    case 'FAILED': return 'Gagal';
    default: return s;
  }
}

export function statusBadgeClass(s: OrderStatus) {
  switch (s) {
    case 'COMPLETED':
      return 'bg-green-100 text-green-700';
    case 'CONFIRMED':
      return 'bg-emerald-100 text-emerald-700';
    case 'EXPIRED':
    case 'FAILED':
      return 'bg-red-100 text-red-700';
    case 'UNDERPAID':
      return 'bg-yellow-100 text-yellow-700';
    case 'WAITING_PAYMENT':
    case 'WAITING_CONFIRMATION':
      return 'bg-blue-100 text-blue-700';
    case 'PENDING':
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export function truncate(s: string, len = 10) {
  if (!s) return '-';
  return s.length > len ? `${s.slice(0, len)}…` : s;
}

export function fmtDate(iso?: string | null) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleString('id-ID');
}

export function remainingLabel(expiresAt?: string | null) {
  if (!expiresAt) return '-';
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return 'Expired';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${sec}s`;
}
