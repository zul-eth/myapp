'use client';

import { useState } from 'react';
import { Coin } from '@/types/coin';
import { Network } from '@/types/network';

type Props = {
  coins: Coin[];
  networks: Network[];
  onSubmit: (coinId: string, networkId: string) => Promise<void> | void;
  disabled?: boolean;
};

export default function CoinNetworkForm({ coins, networks, onSubmit, disabled }: Props) {
  const [coinId, setCoinId] = useState('');
  const [networkId, setNetworkId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!coinId || !networkId) {
      setMsg('Pilih coin dan network terlebih dahulu');
      return;
    }
    try {
      setSubmitting(true);
      await onSubmit(coinId, networkId);
      setCoinId('');
      setNetworkId('');
      setMsg('Relasi berhasil dibuat');
      setTimeout(() => setMsg(null), 2000);
    } catch (err: any) {
      setMsg(err?.message || 'Gagal membuat relasi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border p-4 space-y-3">
      <h2 className="font-medium">Buat Relasi</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <select
          className="rounded-lg border px-3 py-2"
          value={coinId}
          onChange={(e) => setCoinId(e.target.value)}
          disabled={disabled || submitting}
        >
          <option value="">Pilih Coin</option>
          {coins.map((c) => (
            <option key={c.id} value={c.id}>
              {c.symbol} — {c.name}
            </option>
          ))}
        </select>

        <select
          className="rounded-lg border px-3 py-2"
          value={networkId}
          onChange={(e) => setNetworkId(e.target.value)}
          disabled={disabled || submitting}
        >
          <option value="">Pilih Network</option>
          {networks.map((n) => (
            <option key={n.id} value={n.id}>
              {n.name}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="rounded-lg bg-black text-white px-4 py-2 disabled:opacity-50"
          disabled={disabled || submitting}
        >
          {submitting ? 'Menyimpan...' : 'Hubungkan'}
        </button>
      </div>

      {msg && <p className="text-sm text-gray-600">{msg}</p>}
    </form>
  );
}
