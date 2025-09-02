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
  buyCoin: { symbol: string; name: string };
  buyNetwork: { symbol: string | null; name: string };
  payCoin: { symbol: string; name: string };
  payNetwork: { symbol: string | null; name: string };
};

const symOrName = (s?: string | null, n?: string) => (s && s.trim().length ? s : (n ?? ""));

export default function NewOrderPage() {
  // ====== STATE: DATA DASAR ======
  const [paymentOptions, setPaymentOptions] = useState<PaymentOptionRow[]>([]);
  const [ratesForPayPair, setRatesForPayPair] = useState<RateRow[]>([]);

  // ====== STATE: PILIHAN PAY (dipisah) ======
  const [payWithSymbol, setPayWithSymbol] = useState("");
  // Disimpan sebagai "key" = symbol jika ada, kalau tidak pakai name.
  const [payNetworkKey, setPayNetworkKey] = useState("");

  // ====== STATE: PILIHAN BUY (difilter oleh rate untuk pay pair) ======
  const [coinToBuySymbol, setCoinToBuySymbol] = useState("");
  const [buyNetworkKey, setBuyNetworkKey] = useState("");

  // ====== INPUT LAIN ======
  const [amount, setAmount] = useState<string>("");
  const [receivingAddr, setReceivingAddr] = useState("");
  const [receivingMemo, setReceivingMemo] = useState("");

  // ====== INFO RATE & ERROR ======
  const [rate, setRate] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // ====== HELPERS: cari objek network terpilih (pay/buy) dari key ======
  const selectedPayNetwork = useMemo(() => {
    // cari dari paymentOptions untuk coin pay yang dipilih
    const candidates = paymentOptions.filter((po) => po.coin.symbol === payWithSymbol);
    return candidates
      .map((po) => po.network)
      .find((n) => symOrName(n.symbol, n.name) === payNetworkKey) || null;
  }, [paymentOptions, payWithSymbol, payNetworkKey]);

  const selectedBuyNetwork = useMemo(() => {
    // cari dari ratesForPayPair untuk coin buy yang dipilih
    const candidates = ratesForPayPair.filter((r) => r.buyCoin.symbol === coinToBuySymbol);
    return candidates
      .map((r) => r.buyNetwork)
      .find((n) => symOrName(n.symbol, n.name) === buyNetworkKey) || null;
  }, [ratesForPayPair, coinToBuySymbol, buyNetworkKey]);

  // ====== 1) Muat semua payment options publik (aktif) ======
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

  // ====== 2) Daftar network yang tersedia untuk PAY coin terpilih ======
  // label: NAME SAJA (sesuai permintaan); value/key: symbol jika ada, jika tidak gunakan name.
  const payNetworkOptions = useMemo(() => {
    const nets = paymentOptions
      .filter((po) => po.coin.symbol === payWithSymbol)
      .map((po) => ({
        value: symOrName(po.network.symbol, po.network.name), // key internal
        label: po.network.name, // 🔔 tampilkan NAME, bukan symbol
      }));
    // unikkan
    const map = new Map<string, string>();
    nets.forEach((n) => map.set(n.value, n.label));
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [paymentOptions, payWithSymbol]);

  // Pastikan PAY network valid saat PAY coin berubah
  useEffect(() => {
    if (!payNetworkOptions.length) {
      setPayNetworkKey("");
      return;
    }
    if (!payNetworkKey || !payNetworkOptions.some((o) => o.value === payNetworkKey)) {
      setPayNetworkKey(payNetworkOptions[0].value);
    }
  }, [payNetworkOptions, payNetworkKey]);

  // ====== 3) Fetch rates untuk PAY pair → tentukan opsi BUY yang valid ======
  useEffect(() => {
    let cancelled = false;
    async function run() {
      setError(null);
      setRatesForPayPair([]);
      setRate(null);
      setCoinToBuySymbol("");
      setBuyNetworkKey("");
      const payNetSymbol = selectedPayNetwork?.symbol ?? undefined; // gunakan symbol untuk query
      if (!payWithSymbol || !payNetSymbol) return;
      try {
        const rows: RateRow[] = await getPublicExchangeRates({
          payCoinSymbol: payWithSymbol,
          payNetworkSymbol: payNetSymbol,
        });
        if (cancelled) return;
        setRatesForPayPair(rows || []);
        if (rows?.length) {
          const first = rows[0];
          setCoinToBuySymbol(first.buyCoin.symbol);
          setBuyNetworkKey(symOrName(first.buyNetwork.symbol, first.buyNetwork.name));
        }
      } catch (e) {
        if (!cancelled) setRatesForPayPair([]);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [payWithSymbol, selectedPayNetwork?.symbol]); // depend on symbol (bukan key) agar query valid

  // ====== 4) Opsi BUY: coin & network hanya dari ratesForPayPair ======
  const buyCoinOptions = useMemo(() => {
    const map = new Map<string, string>(); // symbol -> name
    for (const r of ratesForPayPair) map.set(r.buyCoin.symbol, r.buyCoin.name);
    return Array.from(map.entries()).map(([symbol, name]) => ({ symbol, name }));
  }, [ratesForPayPair]);

  const buyNetworkOptions = useMemo(() => {
    const map = new Map<string, string>(); // key(symOrName) -> NAME (display only)
    for (const r of ratesForPayPair) {
      if (r.buyCoin.symbol !== coinToBuySymbol) continue;
      const key = symOrName(r.buyNetwork.symbol, r.buyNetwork.name);
      const label = r.buyNetwork.name; // 🔔 tampilkan NAME saja
      map.set(key, label);
    }
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [ratesForPayPair, coinToBuySymbol]);

  // Pastikan BUY network valid saat BUY coin berubah
  useEffect(() => {
    if (!buyNetworkOptions.length) {
      setBuyNetworkKey("");
      return;
    }
    const exists = buyNetworkOptions.some((o) => o.value === buyNetworkKey);
    if (!exists) setBuyNetworkKey(buyNetworkOptions[0].value);
  }, [buyNetworkOptions, buyNetworkKey]);

  // ====== 5) Rate otomatis ketika BUY & PAY lengkap ======
  useEffect(() => {
    let cancelled = false;
    async function run() {
      setRate(null);
      setError(null);
      const payNetSymbol = selectedPayNetwork?.symbol ?? undefined;
      const buyNetSymbol = selectedBuyNetwork?.symbol ?? undefined;
      if (!coinToBuySymbol || !buyNetSymbol || !payWithSymbol || !payNetSymbol) return;
      try {
        const rows: RateRow[] = await getPublicExchangeRates({
          buyCoinSymbol: coinToBuySymbol,
          buyNetworkSymbol: buyNetSymbol,
          payCoinSymbol: payWithSymbol,
          payNetworkSymbol: payNetSymbol,
        });
        if (!cancelled) setRate(rows?.[0]?.rate ?? null);
      } catch {
        if (!cancelled) setRate(null);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [
    coinToBuySymbol,
    selectedBuyNetwork?.symbol,
    payWithSymbol,
    selectedPayNetwork?.symbol,
  ]);

  const buyUnavailable =
    !ratesForPayPair.length ||
    !buyCoinOptions.length ||
    !buyNetworkOptions.length ||
    !coinToBuySymbol ||
    !buyNetworkKey;

  // ====== 6) Submit ======
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (!payWithSymbol || !selectedPayNetwork) throw new Error("Pilih Bayar Coin & Network");
      if (!coinToBuySymbol || !selectedBuyNetwork) throw new Error("Pilih Beli Coin & Network");
      if (!amount || Number(amount) <= 0) throw new Error("Jumlah tidak valid");

      const body = {
        // PAY
        payWithSymbol,
        payNetworkSymbol: selectedPayNetwork.symbol ?? undefined,
        payNetworkName: selectedPayNetwork.name,
        // BUY
        coinToBuySymbol,
        buyNetworkSymbol: selectedBuyNetwork.symbol ?? undefined,
        buyNetworkName: selectedBuyNetwork.name,
        // LAINNYA
        amount: Number(amount),
        receivingAddr,
        receivingMemo: receivingMemo || undefined,
        expiresInMinutes: 60,
      };

      const res = await fetch("/api/public/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Buat Order Baru</h1>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded p-3 text-sm">{error}</div>
      )}

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
              value={payNetworkKey}
              onChange={(e) => setPayNetworkKey(e.target.value)}
            >
              {payNetworkOptions.length === 0 && <option value="">(Tidak tersedia)</option>}
              {payNetworkOptions.map((n) => (
                <option key={n.value} value={n.value}>
                  {/* 🔔 Tampilkan NAME saja */}
                  {n.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-gray-500 -mt-2">
          Hanya network yang tersedia untuk coin tersebut yang ditampilkan.
          Pilihan <b>Beli Coin</b> & <b>Network Beli</b> di bawah akan otomatis terfilter agar hanya yang memiliki
          rate terhadap pasangan di atas yang muncul.
        </p>

        {/* ==== BUY (TERFILTER DARI RATE PAY PAIR) ==== */}
        <fieldset className="border rounded p-3">
          <legend className="text-sm px-1">Beli</legend>
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
                value={buyNetworkKey}
                onChange={(e) => setBuyNetworkKey(e.target.value)}
              >
                {buyNetworkOptions.length === 0 && <option value="">(Tidak tersedia)</option>}
                {buyNetworkOptions.map((n) => (
                  <option key={n.value} value={n.value}>
                    {/* 🔔 Tampilkan NAME saja */}
                    {n.label}
                  </option>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Alamat Penerima</label>
            <input
              type="text"
              className="border rounded p-2 w-full"
              value={receivingAddr}
              onChange={(e) => setReceivingAddr(e.target.value)}
              placeholder="0x..., T..., atau sesuai jaringan"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Memo/Tag (opsional)</label>
            <input
              type="text"
              className="border rounded p-2 w-full"
              value={receivingMemo}
              onChange={(e) => setReceivingMemo(e.target.value)}
              placeholder="XRP tag / EOS memo / TON comment, bila diperlukan"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={
            busy ||
            !payWithSymbol ||
            !payNetworkKey ||
            !coinToBuySymbol ||
            !buyNetworkKey ||
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
