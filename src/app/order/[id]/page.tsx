'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getOrder, updateOrder } from '@/lib/api/orders';
import type { OrderDTO } from '@/types/order';
import { fmtDate, remainingLabel, statusBadgeClass, statusLabel, truncate } from '@/lib/ui/order';

const EXPIRABLE_STATUSES = new Set(['WAITING_PAYMENT', 'UNDERPAID'] as const);
const STOP_POLL_STATUSES = new Set(['COMPLETED', 'FAILED', 'EXPIRED'] as const); // tetap polling saat CONFIRMED

export default function ClientOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<OrderDTO | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // tx submission (opsional)
  const [txHash, setTxHash] = useState('');
  const [saving, setSaving] = useState(false);

  // manual validate
  const [validating, setValidating] = useState(false);

  // polling
  const timer = useRef<number | null>(null);

  async function load() {
    try {
      setErr(null);
      const res = await getOrder(id);
      setData(res.data);
      if (res.data?.txHash) setTxHash(res.data.txHash);
    } catch (e: any) {
      setErr(e?.message || 'Gagal mengambil data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    load();

    // Poll tiap 5 detik sampai status final (COMPLETED/FAILED/EXPIRED)
    timer.current = window.setInterval(async () => {
      setData((cur) => {
        const isFinal = !!cur && STOP_POLL_STATUSES.has(cur.status as any);
        if (!isFinal) load();
        return cur;
      });
    }, 5000);

    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const isExpirable = useMemo(() => (data ? EXPIRABLE_STATUSES.has(data.status as any) : false), [data?.status]);

  const expired = useMemo(() => {
    if (!data?.expiresAt || !isExpirable) return false;
    return new Date(data.expiresAt).getTime() - Date.now() <= 0;
  }, [data?.expiresAt, isExpirable]);

  async function saveTx() {
    if (!data) return;
    try {
      setSaving(true);
      await updateOrder(data.id, { txHash: txHash || null });
      await load();
      alert('Tx hash tersimpan');
    } catch (e: any) {
      alert(e?.message || 'Gagal menyimpan tx hash');
    } finally {
      setSaving(false);
    }
  }

  async function validateNow() {
    if (!data) return;
    try {
      setValidating(true);
      // Endpoint ini opsional: kalau belum ada akan 404 dan diabaikan
      await fetch(`/api/orders/${data.id}/validate`, { cache: 'no-store' }).catch(() => {});
      await load();
    } finally {
      setValidating(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <header className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">Order</h1>
        <span className={`rounded px-2 py-1 text-xs ${data ? statusBadgeClass(data.status) : 'bg-gray-100 text-gray-700'}`}>
          {data ? statusLabel(data.status) : '—'}
        </span>
        {data?.createdAt ? <span className="text-xs text-gray-500">dibuat {fmtDate(data.createdAt)}</span> : null}
      </header>

      {err ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>
      ) : loading ? (
        <div className="text-sm text-gray-500">Memuat…</div>
      ) : !data ? null : (
        <div className="space-y-6">
          {/* Ringkasan */}
          <section className="rounded-xl border p-4">
            <h2 className="mb-2 text-sm font-semibold">Ringkasan</h2>
            <div className="grid gap-3 md:grid-cols-3">
              <Info label="ID">{truncate(data.id, 18)}</Info>
              <Info label="Status">
                <span className={`rounded px-2 py-1 text-xs ${statusBadgeClass(data.status)}`}>
                  {statusLabel(data.status)}
                </span>
              </Info>
              <Info label="Kadaluarsa">
                {isExpirable && data.expiresAt ? remainingLabel(data.expiresAt) : '—'}
              </Info>
              <Info label="Beli">{data.coinToBuy?.symbol || data.coinToBuyId}</Info>
              <Info label="Di Jaringan">{data.buyNetwork?.name || data.buyNetworkId}</Info>
              <Info label="Jumlah">{data.amount}</Info>
              <Info label="Rate">{data.priceRate}</Info>
              <Info label="Alamat Penerima" mono>{data.receivingAddr}</Info>
              
              {/* ➕ Tambahkan ini */}
              {data.payoutHash ? (
                <Info label="Payout Tx" mono>
                  <div className="flex items-center gap-2">
                    <span className="break-all">{data.payoutHash}</span>
                    <CopyButton text={data.payoutHash} />
                  </div>
                </Info>
              ) : null}
            </div>
          </section>

          {/* Pembayaran */}
          <section className="rounded-xl border p-4">
            <h2 className="mb-2 text-sm font-semibold">Pembayaran</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Info label="Coin">{data.payWith?.symbol || data.payWithId}</Info>
                <Info label="Network">{data.payNetwork?.name || data.payNetworkId}</Info>
                <Info label="Alamat Pembayaran" mono>
                  <div className="flex items-center gap-2">
                    <span className="break-all">{data.paymentAddr}</span>
                    <CopyButton text={data.paymentAddr} />
                  </div>
                </Info>
                {data.paymentMemo ? (
                  <Info label="Memo / Tag" mono>
                    <div className="flex items-center gap-2">
                      <span className="break-all">{data.paymentMemo}</span>
                      <CopyButton text={data.paymentMemo} />
                    </div>
                  </Info>
                ) : null}
              </div>

              <div className="flex flex-col items-center justify-center">
                <QrPreview value={data.paymentAddr} />
                <p className="mt-2 text-xs text-gray-500">Scan untuk menyalin alamat pembayaran.</p>
              </div>
            </div>

            {/* Pesan status pembayaran */}
            {isExpirable ? (
              expired ? (
                <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  Waktu pembayaran habis. Silakan buat order baru jika ingin melanjutkan.
                </div>
              ) : (
                <div className="mt-3 flex flex-col gap-2 rounded-md border bg-gray-50 p-3 text-sm">
                  <p>
                    Kirim pembayaran tepat ke alamat di atas. Setelah transaksi terkirim,
                    kamu bisa mengisi <em>Tx Hash</em> (opsional) atau klik tombol di bawah untuk cek manual.
                  </p>
                  <div>
                    <button
                      onClick={validateNow}
                      disabled={validating}
                      className="rounded-md border px-3 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
                    >
                      {validating ? 'Mengecek…' : 'Cek Pembayaran Sekarang'}
                    </button>
                  </div>
                </div>
              )
            ) : data.status === 'WAITING_CONFIRMATION' ? (
              <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                Pembayaran diterima. Menunggu konfirmasi jaringan…
              </div>
            ) : data.status === 'CONFIRMED' ? (
              <div className="mt-3 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                Pembayaran <strong>terkonfirmasi</strong>. Aset akan segera dikirim ke alamat penerima.
              </div>
            ) : null}
          </section>

          {/* Tx Hash (opsional untuk user) */}
          <section className="rounded-xl border p-4">
            <h2 className="mb-2 text-sm font-semibold">Konfirmasi Pembayaran (Opsional)</h2>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs text-gray-600">Tx Hash</label>
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm font-mono"
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  placeholder="0x… / TRX… / SOL…"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={saveTx}
                  disabled={saving}
                  className="w-full rounded-md border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  {saving ? 'Menyimpan…' : 'Simpan'}
                </button>
              </div>
            </div>
          </section>

          <div className="flex items-center justify-between">
            <Link href="/order" className="text-sm text-blue-600 hover:underline">
              ← Kembali ke My Orders
            </Link>
            <span className="text-xs text-gray-500">Terakhir diperbarui: {fmtDate(data.updatedAt)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, children, mono = false }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div className="text-sm">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={mono ? 'font-mono break-all' : 'break-words'}>{children}</div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 800);
        } catch {}
      }}
      className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
    >
      {copied ? 'Tersalin ✓' : 'Copy'}
    </button>
  );
}

function QrPreview({ value }: { value: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const QR = await import('qrcode');
        const url = await QR.toDataURL(value, { margin: 1, width: 220 });
        if (mounted) setDataUrl(url);
      } catch {
        setDataUrl(null);
      }
    })();
    return () => { mounted = false; };
  }, [value]);

  if (!dataUrl) {
    return (
      <div className="flex h-[220px] w-[220px] items-center justify-center rounded-md border">
        <span className="text-xs text-gray-500">QR tidak tersedia</span>
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={dataUrl} alt="QR address" className="h-[220px] w-[220px] rounded-md border" />;
}
