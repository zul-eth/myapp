'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getOrder } from '@/lib/api/orders';
import type { OrderDTO } from '@/types/order';
import { fmtDate, statusBadgeClass, statusLabel, truncate, remainingLabel } from '@/lib/ui/order';

export default function MyOrdersPage() {
  const [ids, setIds] = useState<string[]>([]);
  const [rows, setRows] = useState<(OrderDTO | null)[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const cur = JSON.parse(localStorage.getItem('myOrders') || '[]') as string[];
      setIds(cur);
    } catch {
      setIds([]);
    }
  }, []);

  async function load() {
    setLoading(true);
    try {
      const result = await Promise.all(
        ids.map(async (id) => {
          try {
            const res = await getOrder(id);
            return res.data;
          } catch {
            return null;
          }
        })
      );
      setRows(result);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ids.length) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(',')]);

  const nonNullRows = useMemo(() => rows.filter(Boolean) as OrderDTO[], [rows]);

  function removeId(id: string) {
    const next = ids.filter((x) => x !== id);
    setIds(next);
    try {
      localStorage.setItem('myOrders', JSON.stringify(next));
    } catch {}
    setRows((cur) => cur.filter((r) => (r as OrderDTO | null)?.id !== id));
  }

  return (
    <div className="p-6">
      <header className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">My Orders</h1>
        <div className="flex items-center gap-2">
          <Link href="/order/new" className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50">
            + Order Baru
          </Link>
          <button
            onClick={load}
            className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </header>

      {ids.length === 0 ? (
        <div className="rounded-md border bg-gray-50 p-4 text-sm text-gray-600">
          Belum ada order di perangkat ini. Mulai dari{' '}
          <Link href="/order/new" className="text-blue-600 hover:underline">
            buat order baru
          </Link>
          .
        </div>
      ) : (
        <div className="overflow-auto rounded-xl border">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="[&>th]:py-2 [&>th]:px-3 text-left">
                <th>ID</th>
                <th>Pair</th>
                <th>Amount</th>
                <th>Rate</th>
                <th>Status</th>
                <th>Dibuat</th>
                <th>Expired</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={8} className="p-4 text-center text-gray-500">Memuat…</td></tr>
              ) : nonNullRows.length === 0 ? (
                <tr><td colSpan={8} className="p-4 text-center text-gray-500">Data tidak tersedia</td></tr>
              ) : nonNullRows.map((r) => (
                <tr key={r.id} className="[&>td]:py-2 [&>td]:px-3">
                  <td className="font-mono">{truncate(r.id, 10)}</td>
                  <td>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {r.coinToBuy?.symbol || r.coinToBuyId} on {r.buyNetwork?.name || r.buyNetworkId}
                      </span>
                      <span className="text-xs text-gray-500">
                        pay with {r.payWith?.symbol || r.payWithId} on {r.payNetwork?.name || r.payNetworkId}
                      </span>
                    </div>
                  </td>
                  <td>{r.amount}</td>
                  <td>{r.priceRate}</td>
                  <td>
                    <span className={`rounded px-2 py-1 text-xs ${statusBadgeClass(r.status)}`}>
                      {statusLabel(r.status)}
                    </span>
                  </td>
                  <td>{fmtDate(r.createdAt)}</td>
                  <td>{remainingLabel(r.expiresAt)}</td>
                  <td className="flex items-center gap-2">
                    <Link
                      href={`/order/${r.id}`}
                      className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                    >
                      Buka
                    </Link>
                    <button
                      onClick={() => removeId(r.id)}
                      className="rounded-md border px-2 py-1 text-xs hover:bg-red-50"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
