'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { getOrderById, updateOrderStatus, type Order } from '@/lib/api/order';
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

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [data, setData] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState<boolean>(false);
  const [status, setStatus] = useState<OrderStatus>('PENDING');

  // QR
  const [qr, setQr] = useState<string | null>(null);

  // countdown
  const expiresAtDate = useMemo(
    () => (data?.expiresAt ? new Date(data.expiresAt) : null),
    [data?.expiresAt]
  );
  const [remaining, setRemaining] = useState<string>('-');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getOrderById(id);
      const order: Order = (result as any).order ?? (result as any);
      setData(order);
      setStatus(order.status);
    } catch (e: any) {
      setError(e?.message || 'Gagal memuat order');
    } finally {
      setLoading(false);
    }
  };

  // polling tiap 10s selama belum final
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!data) return;
    const final = ['COMPLETED', 'FAILED', 'EXPIRED'] as OrderStatus[];
    if (final.includes(data.status)) return;

    const t = setInterval(() => {
      load();
    }, 10000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.status]);

  // generate QR payment address
  useEffect(() => {
    (async () => {
      if (!data?.paymentAddr) {
        setQr(null);
        return;
      }
      try {
        const { toDataURL } = await import('qrcode');
        const url = await toDataURL(data.paymentAddr);
        setQr(url);
      } catch (e) {
        console.error('QR generate error', e);
        setQr(null);
      }
    })();
  }, [data?.paymentAddr]);

  // countdown ke expiresAt
  useEffect(() => {
    if (!expiresAtDate) {
      setRemaining('-');
      return;
    }
    const update = () => {
      const diff = +expiresAtDate - Date.now();
      if (diff <= 0) {
        setRemaining('00:00');
        return;
      }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [expiresAtDate]);

  const handleUpdateStatus = async () => {
    if (!data) return;
    setWorking(true);
    try {
      const { order } = await updateOrderStatus(data.id, status);
      setData(order);
    } catch (e: any) {
      setError(e?.message || 'Gagal mengubah status');
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
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

      {loading ? (
        <div className="text-gray-500">Memuat...</div>
      ) : !data ? (
        <div className="text-gray-500">Order tidak ditemukan</div>
      ) : (
        <>
          <div className="rounded-xl border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              <Info label="Status">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
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
              <Info label="Alamat Penerima">{data.receivingAddr ?? '-'}</Info>
            </div>
          </div>

          <div className="rounded-xl border p-4 space-y-3">
            <h2 className="font-medium">Pembayaran</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              <div className="md:col-span-1">
                <div className="text-xs text-gray-500 mb-2">Alamat Pembayaran</div>
                <div className="font-mono break-all">{data.paymentAddr ?? '-'}</div>
                {data.paymentAddr && (
                  <div className="mt-2 flex gap-2">
                    <button
                      className="rounded-lg border px-3 py-1 text-xs"
                      onClick={() => {
                        navigator.clipboard.writeText(data.paymentAddr || '');
                      }}
                    >
                      Copy
                    </button>
                  </div>
                )}
              </div>
              <div className="md:col-span-2">
                {qr ? (
                  <img
                    src={qr}
                    alt="QR Pembayaran"
                    className="w-48 h-48 border rounded-xl"
                  />
                ) : (
                  <div className="text-gray-500">QR belum tersedia</div>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Kirim pembayaran ke alamat di atas sebelum waktu habis.
            </p>
          </div>

          <div className="rounded-xl border p-4 space-y-3">
            <h2 className="font-medium">Update Status</h2>
            <div className="flex items-center gap-3">
              <select
                className="rounded-lg border px-3 py-2"
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                className="rounded-lg bg-black text-white px-4 py-2 disabled:opacity-50"
                onClick={handleUpdateStatus}
                disabled={working}
              >
                {working ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Backend: PUT <code>/api/order/:id</code> body <code>{"{ status }"}</code>.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="font-medium break-all">{children}</div>
    </div>
  );
}
