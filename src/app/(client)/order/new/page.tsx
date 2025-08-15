"use client";

import { useEffect, useMemo, useState } from "react";
import { clientCreateOrder, clientGetOrderDetail, clientCancelOrder } from "@/lib/api/order";

/* ---------- Utils ---------- */
const nf = (n: number | string) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 8 }).format(Number(n || 0));
const cx = (...a: Array<string | false | null | undefined>) => a.filter(Boolean).join(" ");

type Pair = {
  id: string;
  rate: number;
  labelLong: string;
  labelShort: string;
  buy: { coin: { id: string; symbol: string; name: string; logoUrl?: string | null }, network: { id: string; name: string; family: string } };
  pay: { coin: { id: string; symbol: string; name: string; logoUrl?: string | null }, network: { id: string; name: string; family: string } };
};

type OrderSum = {
  id: string;
  status: string;
  amount: number;
  priceRate: number;
  paymentAddr: string;
  expiresAt?: string | null;
  coinToBuy?: { symbol: string } | null;
  payWith?: { symbol: string } | null;
  payNetwork?: { name: string } | null;
  createdAt?: string | null;
};

const HISTORY_KEY = "order_history_v1";
const loadHistoryIds = (): string[] => {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
};
const saveHistoryIds = (ids: string[]) => localStorage.setItem(HISTORY_KEY, JSON.stringify(ids.slice(0, 20)));
const addHistoryId = (id: string) => {
  const ids = loadHistoryIds();
  if (!ids.includes(id)) ids.unshift(id);
  saveHistoryIds(ids);
};
const removeHistoryId = (id: string) => {
  const ids = loadHistoryIds().filter(x => x !== id);
  saveHistoryIds(ids);
};

// Avatar kecil (fallback 1 huruf)
function Avatar({ src, name, className }: { src?: string | null; name: string; className?: string }) {
  const initial = (name?.trim()?.[0] || "•").toUpperCase();
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} className={cx("h-6 w-6 rounded-full object-cover", className)} />
  ) : (
    <div className={cx("h-6 w-6 rounded-full bg-gray-200 grid place-items-center text-xs font-semibold", className)}>
      {initial}
    </div>
  );
}

/* ---------- Bottom Sheet ---------- */
type SheetItem = { id: string; title: string; subtitle?: string; iconUrl?: string | null };
function BottomSheet({
  title, open, onClose, items, onSelect,
}: { title: string; open: boolean; onClose: () => void; items: SheetItem[]; onSelect: (id: string) => void; }) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const k = q.trim().toLowerCase();
    return k ? items.filter(i => i.title.toLowerCase().includes(k) || i.subtitle?.toLowerCase().includes(k)) : items;
  }, [items, q]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-4 shadow-2xl">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-gray-300" />
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded p-1 text-gray-500 hover:bg-gray-100">✕</button>
        </div>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search…" className="w-full rounded border p-2 text-sm mb-3" />
        <div className="max-h-[50vh] overflow-auto">
          {list.map(i => (
            <button key={i.id} onClick={() => { onSelect(i.id); onClose(); }} className="flex w-full items-center gap-3 rounded p-2 text-left hover:bg-gray-50">
              <Avatar src={i.iconUrl} name={i.title} />
              <div className="flex-1">
                <div className="text-sm font-medium">{i.title}</div>
                {i.subtitle && <div className="text-xs text-gray-500">{i.subtitle}</div>}
              </div>
            </button>
          ))}
          {list.length === 0 && <div className="p-4 text-center text-sm text-gray-500">No results</div>}
        </div>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */
export default function NewOrderPage() {
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [loadingPairs, setLoadingPairs] = useState(true);

  // PAY (From)
  const [payNetworkId, setPayNetworkId] = useState("");
  const [payCoinId, setPayCoinId] = useState("");
  // BUY (To)
  const [buyNetworkId, setBuyNetworkId] = useState("");
  const [buyCoinId, setBuyCoinId] = useState("");

  const [amount, setAmount] = useState("");
  const [receivingAddr, setReceivingAddr] = useState("");
  const [receivingMemo, setReceivingMemo] = useState("");
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [sheet, setSheet] = useState<null | "payNet" | "payTok" | "buyNet" | "buyTok">(null);

  // HISTORY state
  const [historyIds, setHistoryIds] = useState<string[]>([]);
  const [orders, setOrders] = useState<OrderSum[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  /* Fetch Pairs */
  useEffect(() => {
    setLoadingPairs(true);
    fetch("/api/public/pairs", { cache: "no-store" })
      .then(r => r.json())
      .then((data: Pair[]) => {
        setPairs(data || []);
        if (data?.length) {
          const p = data[0];
          setPayNetworkId(p.pay.network.id);
          setPayCoinId(p.pay.coin.id);
          setBuyNetworkId(p.buy.network.id);
          setBuyCoinId(p.buy.coin.id);
        }
      })
      .finally(() => setLoadingPairs(false));
  }, []);

  /* Load history IDs from localStorage */
  useEffect(() => {
    setHistoryIds(loadHistoryIds());
  }, []);

  /* Fetch details for history IDs */
  const refreshHistory = async () => {
    const ids = loadHistoryIds();
    if (!ids.length) { setOrders([]); setHistoryIds([]); return; }
    setLoadingHistory(true);
    const results: OrderSum[] = [];
    for (const id of ids) {
      try {
        const o = await clientGetOrderDetail(id);
        results.push(o);
      } catch {
        // kalau 404, buang dari history
        removeHistoryId(id);
      }
    }
    // urutkan terbaru dulu (createdAt bila ada, fallback id)
    results.sort((a: any,b: any) => (new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()));
    setOrders(results);
    setHistoryIds(loadHistoryIds());
    setLoadingHistory(false);
  };
  useEffect(() => { refreshHistory().catch(() => {}); }, []);

  /* Derive candidates untuk picker */
  const payNetworks: SheetItem[] = useMemo(() => {
    const map = new Map<string, SheetItem>();
    for (const p of pairs) {
      const n = p.pay.network;
      if (!map.has(n.id)) map.set(n.id, { id: n.id, title: n.name, subtitle: n.family });
    }
    return [...map.values()];
  }, [pairs]);

  const payTokens: SheetItem[] = useMemo(() => {
    const map = new Map<string, SheetItem>();
    for (const p of pairs.filter(x => !payNetworkId || x.pay.network.id === payNetworkId)) {
      const c = p.pay.coin;
      if (!map.has(c.id)) map.set(c.id, { id: c.id, title: c.symbol, subtitle: c.name, iconUrl: c.logoUrl ?? undefined });
    }
    return [...map.values()];
  }, [pairs, payNetworkId]);

  const buyNetworks: SheetItem[] = useMemo(() => {
    const map = new Map<string, SheetItem>();
    for (const p of pairs.filter(x =>
      (!payNetworkId || x.pay.network.id === payNetworkId) &&
      (!payCoinId || x.pay.coin.id === payCoinId)
    )) {
      const n = p.buy.network;
      if (!map.has(n.id)) map.set(n.id, { id: n.id, title: n.name, subtitle: n.family });
    }
    return [...map.values()];
  }, [pairs, payNetworkId, payCoinId]);

  const buyTokens: SheetItem[] = useMemo(() => {
    const map = new Map<string, SheetItem>();
    for (const p of pairs.filter(x =>
      (!payNetworkId || x.pay.network.id === payNetworkId) &&
      (!payCoinId || x.pay.coin.id === payCoinId) &&
      (!buyNetworkId || x.buy.network.id === buyNetworkId)
    )) {
      const c = p.buy.coin;
      if (!map.has(c.id)) map.set(c.id, { id: c.id, title: c.symbol, subtitle: c.name, iconUrl: c.logoUrl ?? undefined });
    }
    return [...map.values()];
  }, [pairs, payNetworkId, payCoinId, buyNetworkId]);

  // match pair
  const pair = useMemo(() =>
    pairs.find(p =>
      p.pay.network.id === payNetworkId &&
      p.pay.coin.id === payCoinId &&
      p.buy.network.id === buyNetworkId &&
      p.buy.coin.id === buyCoinId
    ), [pairs, payNetworkId, payCoinId, buyNetworkId, buyCoinId]);

  const estPay = useMemo(() => {
    const a = Number(amount || 0);
    const r = Number(pair?.rate || 0);
    return a > 0 && r > 0 ? a * r : 0;
  }, [amount, pair?.rate]);

  function validate() {
    const next: Record<string,string> = {};
    if (!pair) next.pair = "Kombinasi BUY/PAY & network tidak tersedia.";
    if (!amount || Number(amount) <= 0) next.amount = "Masukkan jumlah > 0.";
    if (!receivingAddr || receivingAddr.trim().length < 6) next.receivingAddr = "Alamat tujuan minimal 6 karakter.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !pair) return;
    const order = await clientCreateOrder({
      pairId: pair.id,
      amount: Number(amount),
      receivingAddr: receivingAddr.trim(),
      receivingMemo: receivingMemo?.trim() || null,
    });
    // simpan ke histori sebelum redirect
    addHistoryId(order.id);
    window.location.href = `/order/${order.id}`;
  }

  // label tombol picker
  const payNetLabel = payNetworks.find(n => n.id === payNetworkId)?.title || "Select Network";
  const payTokLabel = payTokens.find(t => t.id === payCoinId)?.title || "Select Token";
  const buyNetLabel = buyNetworks.find(n => n.id === buyNetworkId)?.title || "Select Network";
  const buyTokLabel = buyTokens.find(t => t.id === buyCoinId)?.title || "Select Token";

  /* -------- Render -------- */
  return (
    <div className="mx-auto max-w-lg p-4 md:p-6 space-y-6">
      {/* SWAP CARD */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="rounded-t-2xl bg-gray-900 p-4 text-white">
          <div className="text-lg font-semibold">Swap</div>
        </div>

        <form onSubmit={submit} className="space-y-4 p-4">
          {/* FROM / PAY */}
          <section className="rounded-xl border p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">From (PAY)</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => setSheet("payNet")} className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm">
                  <Avatar name={payNetLabel} />
                  <span>{payNetLabel}</span>
                </button>
                <button type="button" onClick={() => setSheet("payTok")} className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm">
                  <Avatar name={payTokLabel} />
                  <span>{payTokLabel}</span>
                </button>
              </div>
            </div>
            <input className="w-full rounded border p-3 text-2xl tracking-tight bg-gray-50" readOnly value={estPay ? nf(estPay) : "0.0"} />
            <div className="mt-1 text-xs text-gray-500">Estimasi bayar (auto): amount × rate</div>
          </section>

          {/* TO / BUY */}
          <section className="rounded-xl border p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">To (BUY)</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => setSheet("buyNet")} className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm">
                  <Avatar name={buyNetLabel} />
                  <span>{buyNetLabel}</span>
                </button>
                <button type="button" onClick={() => setSheet("buyTok")} className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm">
                  <Avatar name={buyTokLabel} />
                  <span>{buyTokLabel}</span>
                </button>
              </div>
            </div>
            <input
              type="number" inputMode="decimal" step="any"
              value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="0.0" className="w-full rounded border p-3 text-2xl tracking-tight"
            />
            <div className="mt-1 text-xs text-gray-500">
              1 {pair?.buy.coin.symbol ?? buyTokLabel} = {nf(pair?.rate || 0)} {pair?.pay.coin.symbol ?? payTokLabel}
            </div>
          </section>

          {/* RECEIVE */}
          <section className="rounded-xl border p-3">
            <label className="block text-sm font-medium mb-1">Send to wallet</label>
            <input className="w-full rounded border p-3" value={receivingAddr} onChange={e => setReceivingAddr(e.target.value)} placeholder="0x… / rA… / memo, dsb" />
            <div className="mt-2" />
            <input className="w-full rounded border p-3" value={receivingMemo} onChange={e => setReceivingMemo(e.target.value)} placeholder="Memo/Tag (opsional)" />
          </section>

          {/* ERRORS */}
          {Object.values(errors).length > 0 && (
            <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              {Object.values(errors).map((m, i) => <div key={i}>• {m}</div>)}
            </div>
          )}

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={!pair || loadingPairs}
            className={cx("w-full rounded-xl px-4 py-3 text-white", pair ? "bg-gray-900 hover:bg-black" : "bg-gray-300")}
          >
            {pair ? "Create Order" : "Pair tidak tersedia"}
          </button>
        </form>
      </div>

      {/* ORDER HISTORY */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="flex items-center justify-between rounded-t-2xl bg-gray-900 p-4 text-white">
          <div className="text-lg font-semibold">Your Orders</div>
          <button onClick={() => refreshHistory()} className="rounded bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20">Refresh</button>
        </div>

        <div className="p-4">
          {loadingHistory && <div className="text-sm text-gray-500">Memuat…</div>}
          {!loadingHistory && orders.length === 0 && (
            <div className="text-sm text-gray-500">Belum ada order di perangkat ini.</div>
          )}

          {/* Aktif */}
          {orders.filter(o => !["COMPLETED","EXPIRED","FAILED"].includes(o.status)).length > 0 && (
            <>
              <div className="mb-2 text-sm font-medium">Order Aktif</div>
              <div className="space-y-3">
                {orders.filter(o => !["COMPLETED","EXPIRED","FAILED"].includes(o.status)).map(o => (
                  <div key={o.id} className="rounded border p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <div className="font-medium">{o.payWith?.symbol} → {o.coinToBuy?.symbol}</div>
                        <div className="text-xs text-gray-500">{o.payNetwork?.name}</div>
                      </div>
                      <div className="text-xs font-semibold px-2 py-1 rounded-full border">
                        {o.status}
                      </div>
                    </div>
                    <div className="mt-2 text-sm">
                      Bayar: <b>{nf(Number(o.amount) * Number(o.priceRate))} {o.payWith?.symbol}</b>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <a href={`/order/${o.id}`} className="rounded bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-black">Lanjutkan</a>
                      <button
                        onClick={async () => { await clientCancelOrder(o.id); await refreshHistory(); }}
                        className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
                      >
                        Batalkan
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Riwayat Selesai */}
          {orders.filter(o => ["COMPLETED","EXPIRED","FAILED"].includes(o.status)).length > 0 && (
            <>
              <div className="mt-6 mb-2 text-sm font-medium">Riwayat Terakhir</div>
              <div className="space-y-3">
                {orders.filter(o => ["COMPLETED","EXPIRED","FAILED"].includes(o.status)).slice(0, 10).map(o => (
                  <div key={o.id} className="rounded border p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <div className="font-medium">{o.payWith?.symbol} → {o.coinToBuy?.symbol}</div>
                        <div className="text-xs text-gray-500">{o.payNetwork?.name}</div>
                      </div>
                      <div className={cx(
                        "text-xs font-semibold px-2 py-1 rounded-full border",
                        o.status === "COMPLETED" ? "border-green-600 text-green-700" :
                        o.status === "EXPIRED" ? "border-red-600 text-red-700" : "border-gray-400 text-gray-600"
                      )}>
                        {o.status}
                      </div>
                    </div>
                    <div className="mt-2 text-sm">
                      Dibayar: <b>{nf(Number(o.amount) * Number(o.priceRate))} {o.payWith?.symbol}</b>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <a href={`/order/${o.id}`} className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50">Lihat</a>
                      <button onClick={() => { removeHistoryId(o.id); setHistoryIds(loadHistoryIds()); setOrders(orders.filter(x => x.id !== o.id)); }} className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50">Hapus</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* SHEETS */}
      <BottomSheet
        title="Select Network (PAY)"
        open={sheet === "payNet"}
        onClose={() => setSheet(null)}
        items={payNetworks}
        onSelect={(id) => {
          setPayNetworkId(id);
          if (!pairs.some(p => p.pay.network.id === id && p.pay.coin.id === payCoinId)) {
            const c = pairs.find(p => p.pay.network.id === id)?.pay.coin.id;
            if (c) setPayCoinId(c);
          }
          if (!pairs.some(p => p.pay.network.id === id && p.buy.network.id === buyNetworkId)) {
            const n = pairs.find(p => p.pay.network.id === id)?.buy.network.id;
            if (n) setBuyNetworkId(n);
          }
        }}
      />
      <BottomSheet
        title="Select Token (PAY)"
        open={sheet === "payTok"}
        onClose={() => setSheet(null)}
        items={payTokens}
        onSelect={(id) => setPayCoinId(id)}
      />
      <BottomSheet
        title="Select Network (BUY)"
        open={sheet === "buyNet"}
        onClose={() => setSheet(null)}
        items={buyNetworks}
        onSelect={(id) => {
          setBuyNetworkId(id);
          if (!pairs.some(p => p.pay.network.id === payNetworkId && p.buy.network.id === id && p.buy.coin.id === buyCoinId)) {
            const c = pairs.find(p => p.pay.network.id === payNetworkId && p.buy.network.id === id)?.buy.coin.id;
            if (c) setBuyCoinId(c);
          }
        }}
      />
      <BottomSheet
        title="Select Token (BUY)"
        open={sheet === "buyTok"}
        onClose={() => setSheet(null)}
        items={buyTokens}
        onSelect={(id) => setBuyCoinId(id)}
      />
    </div>
  );
}
