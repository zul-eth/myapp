"use client";

import { useEffect, useMemo, useState } from "react";
import { getPublicPaymentOptions } from "@/lib/api/paymentOption";
import { getPublicExchangeRates } from "@/lib/api/exchangeRate";

type PaymentOptionRow = {
  id: string;
  isActive: boolean;
  coin: { id: string; symbol: string; name: string };
  network: { id: string; symbol: string | null; name: string };
};

type RateRow = {
  id: string;
  rate: number;
  buyCoin: { id: string; symbol: string; name: string };
  buyNetwork: { id: string; symbol: string | null; name: string };
  payCoin: { id: string; symbol: string; name: string };
  payNetwork: { id: string; symbol: string | null; name: string };
};

const symOrName = (s?: string | null, n?: string) => (s && s.trim().length ? s : (n ?? ""));

export default function NewOrderPage() {
  // ====== STATE: DATA DASAR ======
  const [paymentOptions, setPaymentOptions] = useState<PaymentOptionRow[]>([]);
  const [ratesForPayPair, setRatesForPayPair] = useState<RateRow[]>([]);

  // ====== STATE: PILIHAN PAY (dipisah) ======
  const [payWithSymbol, setPayWithSymbol] = useState("");
  const [payNetworkSymbol, setPayNetworkSymbol] = useState("");

  // ====== STATE: PILIHAN BUY (difilter oleh rate untuk pay pair) ======
  const [coinToBuySymbol, setCoinToBuySymbol] = useState("");
  const [buyNetworkSymbol, setBuyNetworkSymbol] = useState("");

  // ====== INPUT LAIN ======
  const [amount, setAmount] = useState<string>("");
  const [receivingAddr, setReceivingAddr] = useState("");
  const [receivingMemo, setReceivingMemo] = useState("");

  // ====== UI ======
  const [rate, setRate] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // 1) Muat semua payment options publik (aktif)
  useEffect(() => {
    getPublicPaymentOptions().then((rows) => {
      const list = Array.isArray(rows) ? rows : [];
      setPaymentOptions(list);
      // set default pay coin & network (first)
      if (list.length) {
        const firstCoin = list[0].coin.symbol;
        setPayWithSymbol(firstCoin);
      }
    });
  }, []);

  // 2) Daftar network yang tersedia untuk pay coin yang dipilih
  const payNetworkOptions = useMemo(() => {
    const nets = paymentOptions
      .filter((po) => po.coin.symbol === payWithSymbol)
      .map((po) => ({
        value: symOrName(po.network.symbol, po.network.name),
        label: po.network.symbol ? `${po.network.symbol} — ${po.network.name}` : po.network.name,
      }));
    // unikkan
    const map = new Map<string, string>();
    nets.forEach((n) => map.set(n.value, n.label));
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [paymentOptions, payWithSymbol]);

  // 3) Pastikan pay network valid saat pay coin berubah
  useEffect(() => {
    if (!payNetworkOptions.length) {
      setPayNetworkSymbol("");
      return;
    }
    if (!payNetworkSymbol || !payNetworkOptions.some((o) => o.value === payNetworkSymbol)) {
      setPayNetworkSymbol(payNetworkOptions[0].value);
    }
  }, [payNetworkOptions, payNetworkSymbol]);

  // 4) Fetch rates untuk pay pair → tentukan opsi BUY yang valid
  useEffect(() => {
    let cancelled = false;
    async function run() {
      setError(null);
      setRatesForPayPair([]);
      setRate(null);
      setCoinToBuySymbol("");
      setBuyNetworkSymbol("");
      if (!payWithSymbol || !payNetworkSymbol) return;
      try {
        const rows: RateRow[] = await getPublicExchangeRates({
          payCoinSymbol: payWithSymbol,
          payNetworkSymbol: payNetworkSymbol,
        });
        if (cancelled) return;
        setRatesForPayPair(rows || []);
        if (rows?.length) {
          const first = rows[0];
          setCoinToBuySymbol(first.buyCoin.symbol);
          setBuyNetworkSymbol(symOrName(first.buyNetwork.symbol, first.buyNetwork.name));
        }
      } catch (e) {
        if (!cancelled) setRatesForPayPair([]);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [payWithSymbol, payNetworkSymbol]);

  // 5) Opsi BUY: coin & network hanya dari ratesForPayPair
  const buyCoinOptions = useMemo(() => {
    const map = new Map<string, string>(); // symbol -> name
    for (const r of ratesForPayPair) map.set(r.buyCoin.symbol, r.buyCoin.name);
    return Array.from(map.entries()).map(([symbol, name]) => ({ symbol, name }));
  }, [ratesForPayPair]);

  const buyNetworkOptions = useMemo(() => {
    const map = new Map<string, string>(); // value(symOrName) -> label
    for (const r of ratesForPayPair) {
      if (r.buyCoin.symbol !== coinToBuySymbol) continue;
      const key = symOrName(r.buyNetwork.symbol, r.buyNetwork.name);
      const label = r.buyNetwork.symbol ? `${r.buyNetwork.symbol} — ${r.buyNetwork.name}` : r.buyNetwork.name;
      map.set(key, label);
    }
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [ratesForPayPair, coinToBuySymbol]);

  // 6) Pastikan buy network valid saat buy coin berubah
  useEffect(() => {
    if (!buyNetworkOptions.length) {
      setBuyNetworkSymbol("");
      return;
    }
    const exists = buyNetworkOptions.some((o) => o.value === buyNetworkSymbol);
    if (!exists) setBuyNetworkSymbol(buyNetworkOptions[0].value);
  }, [buyNetworkOptions, buyNetworkSymbol]);

  // 7) Rate otomatis ketika BUY & PAY lengkap
  useEffect(() => {
    let cancelled = false;
    async function run() {
      setRate(null);
      setError(null);
      if (!coinToBuySymbol || !buyNetworkSymbol || !payWithSymbol || !payNetworkSymbol) return;
      try {
        const rows: RateRow[] = await getPublicExchangeRates({
          buyCoinSymbol: coinToBuySymbol,
          buyNetworkSymbol: buyNetworkSymbol,
          payCoinSymbol: payWithSymbol,
          payNetworkSymbol: payNetworkSymbol,
        });
        if (!cancelled) setRate(rows?.[0]?.rate ?? null);
      } catch {
        if (!cancelled) setRate(null);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [coinToBuySymbol, buyNetworkSymbol, payWithSymbol, payNetworkSymbol]);

  // 8) Submit
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      if (!payWithSymbol || !payNetworkSymbol) throw new Error("Pilih Bayar Coin & Network");
      if (!coinToBuySymbol || !buyNetworkSymbol) throw new Error("Pilih Beli Coin & Network");
      if (!amount || Number(amount) <= 0) throw new Error("Jumlah tidak valid");

      const res = await fetch("/api/public/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // PAY pakai symbol
          payWithSymbol,
          payNetworkSymbol,
          // BUY pakai symbol
          coinToBuySymbol,
          buyNetworkSymbol,
          amount: Number(amount),
          receivingAddr,
          receivingMemo: receivingMemo || undefined,
          expiresInMinutes: 60,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Invalid input");
      window.location.href = `/order/${data.id}`;
    } catch (err: any) {
      setError(err.message ?? "Invalid input");
    } finally {
      setBusy(false);
    }
  }

  const buyUnavailable = !!payWithSymbol && !!payNetworkSymbol && ratesForPayPair.length === 0;

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Buat Order</h1>

      <form onSubmit={submit} className="space-y-4">
        {/* ==== PAY: DIPISAH ==== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Bayar Coin</label>
            <select
              className="border rounded p-2 w-full"
              value={payWithSymbol}
              onChange={(e) => setPayWithSymbol(e.target.value)}
            >
              {Array.from(new Set(paymentOptions.map((p) => p.coin.symbol))).map((sym) => {
                const name = paymentOptions.find((p) => p.coin.symbol === sym)?.coin.name ?? sym;
                return (
                  <option key={sym} value={sym}>
                    {sym} — {name}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Bayar Network</label>
            <select
              className="border rounded p-2 w-full"
              value={payNetworkSymbol}
              onChange={(e) => setPayNetworkSymbol(e.target.value)}
            >
              {payNetworkOptions.length === 0 && <option value="">(Tidak tersedia)</option>}
              {payNetworkOptions.map((n) => (
                <option key={n.value} value={n.value}>{n.label}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-gray-500 -mt-2">
          Hanya network yang tersedia untuk coin tersebut yang ditampilkan.
          Pilihan <b>Beli Coin</b> & <b>Network Beli</b> di bawah akan otomatis terfilter agar hanya menampilkan kombinasi yang punya rate.
        </p>

        {/* ==== BUY: FILTERED BY RATES FOR PAY PAIR ==== */}
        <fieldset disabled={!payWithSymbol || !payNetworkSymbol} className={!payWithSymbol || !payNetworkSymbol ? "opacity-60" : ""}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Beli Coin</label>
              <select
                className="border rounded p-2 w-full"
                value={coinToBuySymbol}
                onChange={(e) => setCoinToBuySymbol(e.target.value)}
              >
                {buyCoinOptions.length === 0 && <option value="">(Tidak tersedia)</option>}
                {buyCoinOptions.map((c) => (
                  <option key={c.symbol} value={c.symbol}>
                    {c.symbol} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1">Network Beli</label>
              <select
                className="border rounded p-2 w-full"
                value={buyNetworkSymbol}
                onChange={(e) => setBuyNetworkSymbol(e.target.value)}
              >
                {buyNetworkOptions.length === 0 && <option value="">(Tidak tersedia)</option>}
                {buyNetworkOptions.map((n) => (
                  <option key={n.value} value={n.value}>{n.label}</option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        {/* ==== AMOUNT & RATE ==== */}
        <div>
          <label className="block text-sm mb-1">Jumlah yang Dibeli</label>
          <input
            type="number"
            step="any"
            className="border rounded p-2 w-full"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
          />
          <div className="text-sm text-gray-700 mt-1">
            Rate saat ini:{" "}
            {rate === null ? <span className="text-gray-400">belum tersedia</span> : <b>{rate}</b>}
          </div>
        </div>

        {/* ==== RECEIVING ==== */}
        <div>
          <label className="block text-sm mb-1">Alamat Menerima</label>
          <input
            className="border rounded p-2 w-full"
            value={receivingAddr}
            onChange={(e) => setReceivingAddr(e.target.value)}
            placeholder="alamat kamu"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Memo (opsional)</label>
          <input
            className="border rounded p-2 w-full"
            value={receivingMemo}
            onChange={(e) => setReceivingMemo(e.target.value)}
            placeholder="memo/tag penerima jika ada"
          />
        </div>

        {/* ==== STATUS & ACTION ==== */}
        {buyUnavailable && (
          <div className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2">
            Tidak ada kombinasi <b>Beli Coin/Network</b> yang memiliki rate untuk metode Bayar ini. Silakan pilih kombinasi Bayar lain.
          </div>
        )}
        {error && <div className="text-red-600 text-sm">{error}</div>}

        <button
          type="submit"
          disabled={
            busy ||
            !payWithSymbol ||
            !payNetworkSymbol ||
            !coinToBuySymbol ||
            !buyNetworkSymbol ||
            buyUnavailable
          }
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {busy ? "Membuat..." : "Buat Order"}
        </button>
      </form>
    </div>
  );
}
