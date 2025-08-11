'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { OrderStatus } from '@prisma/client';
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

export default function OrderListPage() {
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [q, setQ] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await listOrders({ status: status || undefined, q: q || undefined, limit: 100 });
      setOrders(data);
    } catch (e: any) {
      setError(e?.message || 'Gagal memuat orders');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => orders, [orders]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <Link
          href="/order/new"
          className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
        >
          + New Order
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari ID / alamat / tx / memo"
          className="w-64 rounded-lg border px-3 py-2 text-sm"
        />
        <select
          value={status}
          onChange={(e) => setStatus((e.target.value || '') as OrderStatus | '')}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          <option value="">Semua status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          onClick={load}
          disabled={loading}
          className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Rate</th>
              <th className="px-4 py-2">Created</th>
              <th className="px-4 py-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="px-4 py-2 font-mono text-xs">{o.id}</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded px-2 py-1 text-xs ${
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
                    className="rounded-lg border px-3 py-1 text-xs hover:bg-gray-50"
                  >
                    Detail
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && !loading && (
              <tr>
                <td className="px-4 py-6 text-center text-gray-500" colSpan={6}>
                  Tidak ada data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}