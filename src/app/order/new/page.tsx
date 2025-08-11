'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createOrder } from '@/lib/api/orders';
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

  const [coinToBuyId, setCoinToBuyId] = useState('');
  const [buyNetworkId, setBuyNetworkId] = useState('');
  const [payWithId, setPayWithId] = useState('');
  const [payNetworkId, setPayNetworkId] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [receivingAddr, setReceivingAddr] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [c, n, p] = await Promise.all([getCoins(), getNetworks(), getPaymentOptions()]);
        setCoins(c);
        setNetworks(n);
        setPaymentOptions(p);
      } catch (e: any) {
        setError(e?.message || 'Gagal memuat master data');
      }
    })();
  }, []);

  const buyCoinChoices = useMemo(() => coins.filter((c) => c.isActive), [coins]);
  const buyNetworkChoices = useMemo(
    () => networks.filter((n) => n.isActive && n.coinId === coinToBuyId),
    [networks, coinToBuyId]
  );

  const payCoinChoices = useMemo(
    () =>
      coins.filter((c) =>
        paymentOptions.some((p) => p.coinId === c.id && p.isActive),
      ),
    [coins, paymentOptions]
  );
  const payNetworkChoices = useMemo(
    () =>
      networks.filter(
        (n) =>
          n.isActive &&
          n.coinId === payWithId &&
          paymentOptions.some((p) => p.coinId === payWithId && p.networkId === n.id && p.isActive),
      ),
    [networks, paymentOptions, payWithId]
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!coinToBuyId || !buyNetworkId || !payWithId || !payNetworkId || !amount || !receivingAddr) {
      setError('Lengkapi form terlebih dahulu');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await createOrder({
        coinToBuyId,
        buyNetworkId,
        payWithId,
        payNetworkId,
        amount: Number(amount),
        receivingAddr,
      });
      router.push(`/order/${res.order.id}`);
    } catch (e: any) {
      setError(e?.message || 'Gagal membuat order');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Buat Order Baru</h1>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="grid gap-4">
        <label className="grid gap-1">
          <span className="text-sm text-gray-600">Coin yang dibeli</span>
          <select
            className="rounded-lg border px-3 py-2 text-sm"
            value={coinToBuyId}
            onChange={(e) => {
              setCoinToBuyId(e.target.value);
              setBuyNetworkId(''); // reset jaringan beli saat coin berubah
            }}
            disabled={loading}
          >
            <option value="">Pilih coin</option>
            {buyCoinChoices.map((c) => (
              <option key={c.id} value={c.id}>
                {c.symbol} — {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-gray-600">Jaringan coin yang dibeli</span>
          <select
            className="rounded-lg border px-3 py-2 text-sm"
            value={buyNetworkId}
            onChange={(e) => setBuyNetworkId(e.target.value)}
            disabled={loading}
          >
            <option value="">Pilih jaringan</option>
            {buyNetworkChoices.map((n) => (
              <option key={n.id} value={n.id}>
                {n.chain} — {n.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-sm text-gray-600">Bayar dengan coin</span>
            <select
              className="rounded-lg border px-3 py-2 text-sm"
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

          <label className="grid gap-1">
            <span className="text-sm text-gray-600">Jaringan untuk pembayaran</span>
            <select
              className="rounded-lg border px-3 py-2 text-sm"
              value={payNetworkId}
              onChange={(e) => setPayNetworkId(e.target.value)}
              disabled={loading}
            >
              <option value="">Pilih jaringan</option>
              {payNetworkChoices.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.chain} — {n.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="grid gap-1">
          <span className="text-sm text-gray-600">Jumlah</span>
          <input
            type="number"
            step="any"
            className="rounded-lg border px-3 py-2 text-sm"
            value={amount}
            onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
            disabled={loading}
            placeholder="0.0"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-gray-600">Alamat penerima (receiving address)</span>
          <input
            className="rounded-lg border px-3 py-2 text-sm"
            value={receivingAddr}
            onChange={(e) => setReceivingAddr(e.target.value)}
            disabled={loading}
            placeholder="Alamat dompet kamu"
          />
        </label>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50"
          >
            {loading ? 'Membuat…' : 'Buat Order'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/order')}
            className="rounded-lg border px-4 py-2 text-sm"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}