'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { OrderStatus } from '@prisma/client';
import type { Order } from '@/lib/api/order';
import { listOrders } from '@/lib/api/orders';

const STATUS_OPTIONS: OrderStatus[] = [
  'PENDING',
  'WAITING_PAYMENT',
  'UNDERPAID',
  'WAITING_CONFIRMATION',
  'CONFIRMED',
  'COMPLETED',
  'EXPIRED',
  'FAILED',
];

export default function OrdersPage() {
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await listOrders({
        status: status || undefined,
        q: q || undefined,
        limit: 100,
      });
      setItems(data);
    } catch (e: any) {
      setErr(e?.message || 'Gagal memuat order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = useMemo(() => items, [items]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Riwayat Order</h1>
          <p className="text-sm text-gray-500">Pantau semua order terbaru.</p>
        </div>
        <Link href="/order/new" className="rounded-lg bg-black text-white px-4 py-2 text-sm">
          + Buat Order
        </Link>
      </div>

      <div className="rounded-xl border p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          className="rounded-lg border px-3 py-2"
          placeholder="Cari by Order ID (partial)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="rounded-lg border px-3 py-2"
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus | '')}
        >
          <option value="">Semua Status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button className="rounded-lg border px-4 py-2" onClick={load} disabled={loading}>
            Filter
          </button>
          <button
            className="rounded-lg border px-4 py-2"
            onClick={() => {
              setQ('');
              setStatus('');
              setTimeout(load, 0);
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="rounded-xl border overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-2">Order ID</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Jumlah</th>
              <th className="px-4 py-2">Rate</th>
              <th className="px-4 py-2">Dibuat</th>
              <th className="px-4 py-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Memuat...
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Tidak ada data
                </td>
              </tr>
            ) : (
              visible.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="px-4 py-2 font-mono">{o.id}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                        o.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-700'
                          : o.status === 'EXPIRED' || o.status === 'FAILED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">{o.amount}</td>
                  <td className="px-4 py-2">{o.priceRate}</td>
                  <td className="px-4 py-2">
                    {o.createdAt ? new Date(o.createdAt).toLocaleString() : '-'}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/order/${o.id}`}
                      className="rounded-lg border px-3 py-1 text-xs"
                    >
                      Detail
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {err}
        </div>
      )}
    </div>
  );
}
