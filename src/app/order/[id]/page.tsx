'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { getOrderById, updateOrderStatus, type Order } from '@/lib/api/orders';
import type { OrderStatus } from '@prisma/client';

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

function Info(props: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <div className="text-xs text-gray-500">{props.label}</div>
      <div className="rounded-lg border bg-white px-3 py-2">{props.children}</div>
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('');

  async function load() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getOrderById(id);
      setData(res);
      setNewStatus(res.status);
    } catch (e: any) {
      setError(e?.message || 'Gagal memuat order');
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!id || !newStatus) return;
    setSaving(true);
    setError(null);
    try {
      const res = await updateOrderStatus(id, newStatus);
      setData(res.order);
    } catch (e: any) {
      setError(e?.message || 'Gagal update status');
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const expiresAtDate = useMemo(
    () => (data?.expiresAt ? new Date(data.expiresAt) : null),
    [data?.expiresAt]
  );

  const remaining = useMemo(() => {
    if (!expiresAtDate) return '-';
    const ms = expiresAtDate.getTime() - Date.now();
    if (ms <= 0) return 'Expired';
    const s = Math.floor(ms / 1000);
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    return `${mm}m ${ss}s`;
  }, [expiresAtDate, data?.updatedAt]); // depend on updatedAt to re-render sometimes

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Detail Order</h1>
          <p className="text-sm text-gray-500">ID: {id}</p>
        </div>
        <button className="rounded-lg border px-3 py-2 text-sm" onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {!data && !loading && !error && (
        <div className="rounded-lg border bg-white px-4 py-6 text-gray-500">Data tidak ada</div>
      )}

      {data && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="grid gap-3">
            <Info label="Status">
              <span
                className={`rounded px-2 py-1 text-xs ${
                  data.status === 'COMPLETED'
                    ? 'bg-green-100 text-green-700'
                    : data.status === 'EXPIRED' || data.status === 'FAILED'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {data.status}
              </span>
            </Info>
            <Info label="Jumlah">{data.amount}</Info>
            <Info label="Rate">{data.priceRate}</Info>
            <Info label="Kadaluarsa">{expiresAtDate ? expiresAtDate.toLocaleString() : '-'}</Info>
            <Info label="Sisa Waktu">{expiresAtDate ? remaining : '-'}</Info>
            <Info label="Alamat Pembayaran">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate font-mono text-xs">{data.paymentAddr || '-'}</span>
                <button
                  className="rounded border px-2 py-1 text-xs"
                  onClick={() => {
                    if (data.paymentAddr) navigator.clipboard.writeText(data.paymentAddr);
                  }}
                >
                  Salin
                </button>
              </div>
            </Info>
            {data.paymentMemo ? (
              <Info label="Memo / Tag">
                <span className="font-mono text-xs">{data.paymentMemo}</span>
              </Info>
            ) : null}
          </div>

          <div className="grid gap-3">
            <Info label="Receive Address">
              <span className="font-mono text-xs">{data.receivingAddr || '-'}</span>
            </Info>
            <Info label="TX Hash">
              <span className="font-mono text-xs">{data.txHash || '-'}</span>
            </Info>

            <div className="grid gap-2">
              <div className="text-xs text-gray-500">Update Status</div>
              <div className="flex gap-2">
                <select
                  className="flex-1 rounded-lg border px-3 py-2 text-sm"
                  value={newStatus || ''}
                  onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                  disabled={saving}
                >
                  <option value="">Pilih status</option>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
                  onClick={save}
                  disabled={saving || !newStatus}
                >
                  {saving ? 'Menyimpan…' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}