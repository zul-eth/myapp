'use client';

import { useMemo, useState } from 'react';
import type { Coin } from '@/types/coin';
import type { Network } from '@/types/network';

type Props = {
  coins: Coin[];
  networks: Network[];
  onSubmit: (payload: {
    buyCoinId: string;
    buyNetworkId: string;
    payCoinId: string;
    payNetworkId: string;
    rate: number;
  }) => Promise<void> | void;
  disabled?: boolean;
};

export default function RateForm({ coins, networks, onSubmit, disabled }: Props) {
  // buy
  const [buyCoinId, setBuyCoinId] = useState('');
  const [buyNetworkId, setBuyNetworkId] = useState('');
  // pay
  const [payCoinId, setPayCoinId] = useState('');
  const [payNetworkId, setPayNetworkId] = useState('');

  const [rate, setRate] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // NOTE: jika ingin filter network berdasarkan relasi coin↔network aktif, gunakan data coin.networks
  const buyNetworks = useMemo(() => networks, [networks]);
  const payNetworks = useMemo(() => networks, [networks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (!buyCoinId || !buyNetworkId || !payCoinId || !payNetworkId || !rate) {
      setMsg('Lengkapi semua field dan masukkan rate yang valid');
      return;
    }
    if (buyCoinId === payCoinId && buyNetworkId === payNetworkId) {
      setMsg('Pasangan buy dan pay tidak boleh sama persis');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({ buyCoinId, buyNetworkId, payCoinId, payNetworkId, rate });
      setBuyCoinId('');
      setBuyNetworkId('');
      setPayCoinId('');
      setPayNetworkId('');
      setRate(0);
      setMsg('Rate ditambahkan');
      setTimeout(() => setMsg(null), 2000);
    } catch (e: any) {
      setMsg(e?.message || 'Gagal menambah rate');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border p-4 space-y-3">
      <h2 className="font-medium">Tambah Rate</h2>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="md:col-span-2 space-y-2">
          <div className="text-xs text-gray-500">Aset yang dibeli</div>
          <select
            className="w-full rounded-lg border px-3 py-2"
            value={buyCoinId}
            onChange={(e) => setBuyCoinId(e.target.value)}
            disabled={disabled || submitting}
          >
            <option value="">Pilih Coin (Buy)</option>
            {coins.map((c) => (
              <option key={c.id} value={c.id}>
                {c.symbol} — {c.name}
              </option>
            ))}
          </select>
          <select
            className="w-full rounded-lg border px-3 py-2"
            value={buyNetworkId}
            onChange={(e) => setBuyNetworkId(e.target.value)}
            disabled={disabled || submitting}
          >
            <option value="">Pilih Network (Buy)</option>
            {buyNetworks.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2 space-y-2">
          <div className="text-xs text-gray-500">Dibayar dengan</div>
          <select
            className="w-full rounded-lg border px-3 py-2"
            value={payCoinId}
            onChange={(e) => setPayCoinId(e.target.value)}
            disabled={disabled || submitting}
          >
            <option value="">Pilih Coin (Pay)</option>
            {coins.map((c) => (
              <option key={c.id} value={c.id}>
                {c.symbol} — {c.name}
              </option>
            ))}
          </select>
          <select
            className="w-full rounded-lg border px-3 py-2"
            value={payNetworkId}
            onChange={(e) => setPayNetworkId(e.target.value)}
            disabled={disabled || submitting}
          >
            <option value="">Pilih Network (Pay)</option>
            {payNetworks.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-1">
          <div className="text-xs text-gray-500">Rate</div>
          <input
            type="number"
            step="any"
            min={0}
            className="w-full rounded-lg border px-3 py-2"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            disabled={disabled || submitting}
          />
          <button
            type="submit"
            className="mt-3 w-full rounded-lg bg-black text-white px-4 py-2 disabled:opacity-50"
            disabled={disabled || submitting}
          >
            {submitting ? 'Menyimpan...' : 'Tambah'}
          </button>
        </div>
      </div>

      {msg && <p className="text-sm text-gray-600">{msg}</p>}
    </form>
  );
}
