"use client";

import { use, useEffect, useMemo, useState } from "react";
import { clientGetOrderDetail, clientCancelOrder } from "@/lib/api/order";

type Order = {
  id: string;
  status: "PENDING" | "WAITING_PAYMENT" | "UNDERPAID" | "WAITING_CONFIRMATION" | "CONFIRMED" | "COMPLETED" | "EXPIRED" | "FAILED";
  amount: number;
  priceRate: number;
  paymentAddr: string;
  paymentMemo?: string | null;
  confirmations: number;
  txHash?: string | null;
  expiresAt?: string | null; // ISO
  createdAt?: string | null;
  coinToBuy?: { symbol: string } | null;
  payWith?: { symbol: string } | null;
  payNetwork?: { name: string } | null;
};

const nf = (n: number | string) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 8 }).format(Number(n || 0));

const shortCode = (id: string) => id.replace(/-/g, "").slice(0, 8).toUpperCase();

function useCountdown(expiresAt?: string | null) {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    if (!expiresAt) return; // <- jika tidak ada target, jangan jalan
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [expiresAt]);
  const msLeft = useMemo(() => {
    if (!expiresAt) return 0;
    return Math.max(0, new Date(expiresAt).getTime() - now.getTime());
  }, [expiresAt, now]);
  const s = Math.floor(msLeft / 1000);
  const mm = Math.floor(s / 60).toString().padStart(2, "0");
  const ss = (s % 60).toString().padStart(2, "0");
  return { msLeft, label: `${mm}:${ss}` };
}

export default function OrderDetailPage({
  params,
}: {
  // ⬇️ Next 15: params adalah Promise
  params: Promise<{ id: string }>;
}) {
  // ⬇️ Unwrap params dengan React.use()
  const { id } = use(params);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [copyOk, setCopyOk] = useState(false);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    setLoading(true);
    clientGetOrderDetail(id)
      .then(setOrder)
      .finally(() => setLoading(false));
  }, [id]);

  const isTerminal = !!order && ["COMPLETED", "EXPIRED", "FAILED"].includes(order.status);
  // ⬇️ Hanya hitung timer kalau masih menunggu pembayaran
  const showCountdown = !!order?.expiresAt && order?.status === "WAITING_PAYMENT";
  const { msLeft, label } = useCountdown(showCountdown ? order?.expiresAt : null);
  const isExpired = showCountdown ? msLeft === 0 : false;

  const code = order ? shortCode(order.id) : "";
  const totalPay = order ? Number(order.amount) * Number(order.priceRate) : 0;

  async function copyAddress() {
    if (!order?.paymentAddr) return;
    try {
      await navigator.clipboard.writeText(order.paymentAddr);
      setCopyOk(true);
      setTimeout(() => setCopyOk(false), 1500);
    } catch {
      alert("Tidak bisa menyalin, salin manual.");
    }
  }

  async function cancelOrder() {
    if (!order) return;
    if (!confirm("Batalkan order ini?")) return;
    setCanceling(true);
    try {
      const res = await clientCancelOrder(order.id);
      // Route kita mengembalikan { ok, order }
      setOrder(res.order ?? res);
    } catch (e: any) {
      alert(e?.message || "Gagal membatalkan order");
    } finally {
      setCanceling(false);
    }
  }

  if (loading) return <div className="mx-auto max-w-2xl p-6">Memuat detail…</div>;
  if (!order) return <div className="mx-auto max-w-2xl p-6">Order tidak ditemukan.</div>;

  return (
    <div className="mx-auto max-w-2xl p-4 md:p-6 space-y-4">
      <h1 className="text-xl font-bold">Detail Order</h1>

      {/* Header: ID + kode + countdown / status */}
      <div className="rounded border bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm">
            <div className="text-gray-500">Order ID</div>
            <div className="font-mono break-all">{order.id}</div>
            <div className="text-xs text-gray-500">Kode: <b>{code}</b></div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Berlaku sampai</div>
            <div className="text-lg font-semibold">
              {order.status === "FAILED" && <span className="text-gray-600">DIBATALKAN</span>}
              {order.status === "COMPLETED" && <span className="text-green-700">SELESAI</span>}
              {order.status === "EXPIRED" && <span className="text-red-600">EXPIRED</span>}
              {order.status === "WAITING_PAYMENT" && (
                <span className={isExpired ? "text-red-600" : "text-green-700"}>
                  {isExpired ? "EXPIRED" : label}
                </span>
              )}
              {!["FAILED", "COMPLETED", "EXPIRED", "WAITING_PAYMENT"].includes(order.status) && "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Ringkasan */}
      <div className="rounded border bg-white p-4">
        <div className="font-medium mb-2">Ringkasan</div>
        <p><b>Status:</b> <span className="font-semibold">{order.status}</span></p>
        <p><b>Beli:</b> {nf(order.amount)} {order.coinToBuy?.symbol} @ rate {nf(order.priceRate)}</p>
        <p><b>Bayar dengan:</b> {order.payWith?.symbol} • <b>Jaringan:</b> {order.payNetwork?.name}</p>
        <p><b>Harus dibayar (perkiraan):</b> <span className="font-semibold">{nf(totalPay)} {order.payWith?.symbol}</span></p>
      </div>

      {/* Pembayaran */}
      <div className="rounded border bg-white p-4">
        <div className="font-medium mb-2">Pembayaran</div>
        <div className="text-sm text-gray-500">Alamat Pembayaran:</div>
        <div className="mt-1 font-mono break-all">{order.paymentAddr}</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={copyAddress} className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50">
            {copyOk ? "Disalin ✓" : "Salin Alamat"}
          </button>
          {order.txHash && (
            <a
              href={`https://etherscan.io/tx/${order.txHash}`}
              target="_blank"
              className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Lihat Tx
            </a>
          )}
        </div>
        <div className="mt-3 text-sm">Konfirmasi: {order.confirmations}</div>
        {order.paymentMemo && <div className="mt-1 text-sm">Memo/Tag: <span className="font-mono">{order.paymentMemo}</span></div>}
      </div>

      {/* Info status */}
      {order.status === "WAITING_PAYMENT" && !isExpired && (
        <div className="rounded border border-yellow-200 bg-yellow-50 p-4">
          Lakukan pembayaran ke alamat di atas, lalu tunggu konfirmasi.
        </div>
      )}
      {(order.status === "FAILED" || isExpired) && (
        <div className="rounded border border-red-200 bg-red-50 p-4">
          {order.status === "FAILED" ? "Order dibatalkan." : "Order kedaluwarsa."} Buat order baru untuk melanjutkan.
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <a href="/order/new" className="rounded bg-gray-900 px-4 py-2 text-white hover:bg-black">Buat Order Baru</a>
        {order.status === "WAITING_PAYMENT" && !isExpired && (
          <button onClick={cancelOrder} disabled={canceling} className="rounded border px-4 py-2 hover:bg-gray-50">
            {canceling ? "Membatalkan…" : "Batalkan Order"}
          </button>
        )}
      </div>
    </div>
  );
}
