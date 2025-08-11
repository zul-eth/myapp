'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createOrder } from '@/lib/api/order';
import type { Coin } from '@/types/coin';
import type { Network } from '@/types/network';
import type { PaymentOption } from '@/types/paymentOption';
import { getCoins } from '@/lib/api/coin';
import { getNetworks } from '@/lib/api/network';
import { getPaymentOptions } from '@/lib/api/paymentOption';

export default function NewOrderPage() {
  const router = useRouter();
  const [coins, setCoins] = useState<Coin[]>([]);
  const [networks, setNetworks] = useState<Network[]>([]);
  const [paymentOptions, setPaymentOptions] = useState<PaymentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  // form state
  const [coinToBuyId, setCoinToBuyId] = useState('');
  const [buyNetworkId, setBuyNetworkId] = useState('');
  const [payWithId, setPayWithId] = useState('');
  const [payNetworkId, setPayNetworkId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [receivingAddr, setReceivingAddr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [c, n, po] = await Promise.all([getCoins(), getNetworks(), getPaymentOptions()]);
        setCoins(c);
        setNetworks(n);
        setPaymentOptions(po);
      } catch (e: any) {
        setMsg(e?.message || 'Gagal memuat data awal');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const payCoinChoices = useMemo(() => {
    // unik by coin id
    const map = new Map<string, PaymentOption>();
    paymentOptions.forEach((p) => {
      map.set(p.coin.id, p);
    });
    return [...map.values()].map((p) => p.coin);
  }, [paymentOptions]);

  const filteredPayNetworks = useMemo(() => {
    return paymentOptions
      .filter((p) => p.coin.id === payWithId)
      .map((p) => p.network);
  }, [paymentOptions, payWithId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!coinToBuyId || !buyNetworkId || !payWithId || !payNetworkId || !amount || !receivingAddr) {
      setMsg('Lengkapi semua field');
      return;
    }
    try {
      const { order } = await createOrder({
        coinToBuyId,
        buyNetworkId,
        payWithId,
        payNetworkId,
        amount,
        receivingAddr,
      });
      router.push(`/order/${order.id}`);
    } catch (err: any) {
      setMsg(err?.message || 'Gagal membuat order');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Buat Order Baru</h1>
        <p className="text-sm text-gray-500">Pilih aset yang dibeli dan metode pembayaran.</p>
      </div>

      {msg && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-yellow-800">
          {msg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-xl border p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-1">
            <span className="text-sm">Coin yang Dibeli</span>
            <select
              className="w-full rounded-lg border px-3 py-2"
              value={coinToBuyId}
              onChange={(e) => setCoinToBuyId(e.target.value)}
              disabled={loading}
            >
              <option value="">Pilih coin</option>
              {coins.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.symbol} — {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm">Jaringan (untuk coin yang dibeli)</span>
            <select
              className="w-full rounded-lg border px-3 py-2"
              value={buyNetworkId}
              onChange={(e) => setBuyNetworkId(e.target.value)}
              disabled={loading}
            >
              <option value="">Pilih network</option>
              {networks.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm">Bayar Dengan (coin)</span>
            <select
              className="w-full rounded-lg border px-3 py-2"
              value={payWithId}
              onChange={(e) => {
                setPayWithId(e.target.value);
                setPayNetworkId(''); // reset jaringan bayar saat coin berubah
              }}
              disabled={loading}
            >
              <option value="">Pilih coin</option>
              {payCoinChoices.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.symbol} — {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm">Jaringan (pembayaran)</span>
            <select
              className="w-full rounded-lg border px-3 py-2"
              value={payNetworkId}
              onChange={(e) => setPayNetworkId(e.target.value)}
              disabled={loading || !payWithId}
            >
              <option value="">Pilih network</option>
              {filteredPayNetworks.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm">Jumlah yang Dibeli</span>
            <input
              type="number"
              step="any"
              min={0}
              className="w-full rounded-lg border px-3 py-2"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm">Alamat Penerima (receiving address)</span>
            <input
              type="text"
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Alamat wallet untuk menerima aset"
              value={receivingAddr}
              onChange={(e) => setReceivingAddr(e.target.value)}
            />
          </label>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-lg bg-black text-white px-4 py-2 disabled:opacity-50"
            disabled={loading}
          >
            Buat Order
          </button>
          <button
            type="button"
            className="rounded-lg border px-4 py-2"
            onClick={() => {
              setCoinToBuyId('');
              setBuyNetworkId('');
              setPayWithId('');
              setPayNetworkId('');
              setAmount(0);
              setReceivingAddr('');
              setMsg(null);
            }}
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}
