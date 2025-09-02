"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
// ==== Types yang cukup longgar (agar tahan perubahan API) ====
type Maybe<T> = T | null | undefined;
type OrderView = {
  id: string;
  status:
    | "PENDING"
    | "WAITING_PAYMENT"
    | "WAITING_CONFIRMATION"
    | "CONFIRMED"
    | "COMPLETED"
    | "EXPIRED"
    | "CANCELED"
    | "FAILED";
  amount: number;            // jumlah yang dibeli (buy-coin units)
  priceRate: number;         // harga (pay per buy)
  paymentAddr: string;
  paymentMemo?: string | null;
  expiresAt?: string | null;
  createdAt?: string;

  // relasi (opsional bergantung API)
  coinToBuy?: { symbol: string; name: string } | null;
  buyNetwork?: { symbol?: string | null; name: string } | null;
  payWith?: { symbol: string; name: string } | null;
  payNetwork?: { symbol?: string | null; name: string; requiredConfirmations?: number | null } | null;

  // payment meta
  payment?: {
    decimals?: number | null;
    requiredConfirmations?: number | null;
    assetType?: string | null;
  } | null;
};

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}
function fmt(n: number, max = 8) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: max }).format(n);
}
function symOrName(sym?: Maybe<string>, name?: Maybe<string>) {
  return sym && sym.trim().length ? sym : (name ?? "");
}
function useCountdown(expiresAt?: Maybe<string>) {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const expMs = useMemo(() => (expiresAt ? new Date(expiresAt).getTime() : NaN), [expiresAt]);
  const left = isFinite(expMs) ? Math.max(0, expMs - now) : 0;
  const totalSec = Math.floor(left / 1000);
  const mm = Math.floor(totalSec / 60);
  const ss = totalSec % 60;
  return {
    msLeft: left,
    label: isFinite(expMs) ? `${mm}:${ss.toString().padStart(2, "0")}` : "—",
    isExpired: isFinite(expMs) ? left <= 0 : false,
  };
}

async function fetchOrder(id: string): Promise<OrderView> {
  const res = await fetch(`/api/public/orders/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Gagal memuat order");
  return res.json();
}

async function regenerate(id: string): Promise<OrderView> {
  const res = await fetch(`/api/public/orders/${id}/regenerate`, { method: "POST" });
  if (!res.ok) throw new Error((await res.json()).error ?? "Gagal regenerate");
  return res.json();
}

function Badge({ children, color = "gray" }: { children: any; color?: "green" | "yellow" | "red" | "blue" | "gray" }) {
  const map: Record<string, string> = {
    green: "bg-green-50 text-green-700 ring-green-600/20",
    yellow: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
    red: "bg-red-50 text-red-700 ring-red-600/20",
    blue: "bg-blue-50 text-blue-700 ring-blue-600/20",
    gray: "bg-gray-50 text-gray-700 ring-gray-600/20",
  };
  return <span className={cls("inline-flex items-center rounded px-2 py-1 text-xs font-medium ring-1 ring-inset", map[color])}>{children}</span>;
}

function statusColor(s: OrderView["status"]) {
  switch (s) {
    case "WAITING_PAYMENT": return "yellow";
    case "WAITING_CONFIRMATION": return "blue";
    case "CONFIRMED":
    case "COMPLETED": return "green";
    case "EXPIRED":
    case "CANCELED":
    case "FAILED": return "red";
    default: return "gray";
  }
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderView | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // initial load + polling status tiap 10s
  useEffect(() => {
    let stop = false;
    const load = async () => {
      try { const d = await fetchOrder(id); if (!stop) setOrder(d); }
      catch (e: any) { if (!stop) setErr(e?.message ?? "Gagal memuat"); }
    };
    load();
    const t = setInterval(load, 10_000);
    return () => { stop = true; clearInterval(t); };
  }, [id]);

  const { label: leftLabel, isExpired } = useCountdown(order?.expiresAt ?? undefined);

  const buyCoinSym = order?.coinToBuy?.symbol ?? "";
  const buyNetSym = symOrName(order?.buyNetwork?.symbol, order?.buyNetwork?.name);
  const payCoinSym = order?.payWith?.symbol ?? "";
  const payNetSym = symOrName(order?.payNetwork?.symbol, order?.payNetwork?.name);

  // jumlah yang harus dibayar ≈ amount * priceRate
  const mustPay = useMemo(() => {
    if (!order) return null;
    const v = order.amount * order.priceRate;
    return Number.isFinite(v) ? v : null;
  }, [order?.amount, order?.priceRate]);

  const payDecimals = order?.payment?.decimals ?? 8;  // default tampilkan 8 desimal
  const reqConf = order?.payment?.requiredConfirmations ?? order?.payNetwork?.requiredConfirmations ?? 1;

  async function onRegenerate() {
    if (!order) return;
    setBusy(true); setErr(null);
    try {
      const d = await regenerate(order.id);
      setOrder(d);
    } catch (e: any) {
      setErr(e?.message ?? "Gagal regenerate");
    } finally {
      setBusy(false);
    }
  }

  const canRegenerate = isExpired || ["FAILED", "CANCELED"].includes(order?.status || "");

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Status Order</h1>

      {/* Header ringkas */}
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="text-sm text-gray-500">ID</div>
            <div className="font-mono text-sm break-all">{id}</div>
          </div>
          <div className="space-y-1 text-right">
            <div className="text-sm text-gray-500">Status</div>
            <Badge color={statusColor(order?.status ?? "PENDING")}>{order?.status ?? "—"}</Badge>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-500">Expires in</div>
            <div className={cls("text-lg font-semibold", isExpired ? "text-red-600" : "text-gray-900")}>
              {isExpired ? "Expired" : leftLabel}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Beli (Coin · Network)</div>
            <div className="text-lg font-semibold">
              {buyCoinSym || "—"} <span className="text-gray-500">·</span> {buyNetSym || "—"}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Bayar (Coin · Network)</div>
            <div className="text-lg font-semibold">
              {payCoinSym || "—"} <span className="text-gray-500">·</span> {payNetSym || "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Rincian pembayaran */}
      <div className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
        <div className="font-medium text-gray-900">Bayar ke</div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-500 mb-1">Address</div>
            <div className="flex items-center gap-2">
              <code className="font-mono text-xs break-all">{order?.paymentAddr ?? "—"}</code>
              <button
                type="button"
                className="rounded bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200"
                onClick={() => navigator.clipboard?.writeText(order?.paymentAddr ?? "")}
              >
                Copy
              </button>
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-500 mb-1">Memo / Tag</div>
            <div className="flex items-center gap-2">
              <code className="font-mono text-xs break-all">{order?.paymentMemo ?? "—"}</code>
              {order?.paymentMemo && (
                <button
                  type="button"
                  className="rounded bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200"
                  onClick={() => navigator.clipboard?.writeText(order?.paymentMemo ?? "")}
                >
                  Copy
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <div className="text-sm text-gray-500">Jumlah yang Dibeli</div>
            <div className="text-lg font-semibold">
              {fmt(order?.amount ?? 0)} <span className="text-gray-500">{buyCoinSym}</span>
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-500">Rate</div>
            <div className="text-lg font-semibold">
              {fmt(order?.priceRate ?? 0)} <span className="text-gray-500">{payCoinSym} / {buyCoinSym}</span>
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-500">Jumlah Pembayaran (perkiraan)</div>
            <div className="text-lg font-semibold">
              {mustPay == null ? "—" : fmt(mustPay, Math.min(8, payDecimals || 8))}
              <span className="text-gray-500"> {payCoinSym}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <div className="text-sm text-gray-500">Required confirmations</div>
            <div className="text-base">{reqConf}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Asset</div>
            <div className="text-base">{order?.payment?.assetType ?? "—"}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Decimals</div>
            <div className="text-base">{order?.payment?.decimals ?? "—"}</div>
          </div>
        </div>

        <div className="pt-3 flex items-center gap-3">
          <a href="/order/new" className="text-blue-600 hover:underline text-sm">Buat order baru</a>
          {canRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              disabled={busy}
              className="rounded bg-blue-600 text-white px-3 py-1.5 text-sm disabled:opacity-50"
            >
              {busy ? "Memproses..." : "Ganti alamat (regenerate)"}
            </button>
          )}
        </div>

        {err && <div className="text-red-600 text-sm pt-2">{err}</div>}
      </div>

      {/* Tracker status sederhana */}
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="font-medium mb-3">Progress</div>
        <ul className="space-y-2 text-sm">
          {[
            { key: "WAITING_PAYMENT", label: "Menunggu pembayaran" },
            { key: "WAITING_CONFIRMATION", label: "Menunggu konfirmasi on-chain" },
            { key: "CONFIRMED", label: "Pembayaran terkonfirmasi" },
            { key: "COMPLETED", label: "Pesanan selesai" },
          ].map((s) => {
            const active = order?.status === s.key;
            const done = ["CONFIRMED", "COMPLETED"].includes(order?.status ?? "") && (s.key === "CONFIRMED" || s.key === "COMPLETED");
            const color = done ? "text-green-700" : active ? "text-blue-700" : "text-gray-600";
            return (
              <li key={s.key} className={cls("flex items-center gap-2", color)}>
                <span className={cls(
                  "h-2.5 w-2.5 rounded-full",
                  done ? "bg-green-500" : active ? "bg-blue-500 animate-pulse" : "bg-gray-300"
                )}/>
                <span>{s.label}</span>
              </li>
            );
          })}
          {["EXPIRED", "FAILED", "CANCELED"].includes(order?.status ?? "") && (
            <li className="flex items-center gap-2 text-red-700">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500"/>
              <span>
                {order?.status === "EXPIRED" && "Order telah kedaluwarsa."}
                {order?.status === "FAILED" && "Order gagal diproses."}
                {order?.status === "CANCELED" && "Order dibatalkan."}
              </span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
