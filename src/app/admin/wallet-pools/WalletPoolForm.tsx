'use client';

import { useState } from 'react';
import type { Coin } from '@/types/coin';
import type { Network } from '@/types/network';

type Props = {
  coins: Coin[];
  networks: Network[];
  onSubmit: (payload: {
    coinId: string;
    networkId: string;
    address: string;
    xpub?: string;
  }) => Promise<void> | void;
  disabled?: boolean;
};

export default function WalletPoolForm({ coins, networks, onSubmit, disabled }: Props) {
  const [coinId, setCoinId] = useState('');
  const [networkId, setNetworkId] = useState('');
  const [address, setAddress] = useState('');
  const [xpub, setXpub] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!coinId || !networkId || !address.trim()) {
      setMsg('Lengkapi coin, network, dan address');
      return;
    }
    try {
      setSubmitting(true);
      await onSubmit({ coinId, networkId, address: address.trim(), xpub: xpub.trim() || undefined });
      setCoinId('');
      setNetworkId('');
      setAddress('');
      setXpub('');
      setMsg('Wallet berhasil ditambahkan');
      setTimeout(() => setMsg(null), 2000);
    } catch (e: any) {
      setMsg(e?.message || 'Gagal menambah wallet');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border p-4 space-y-3">
      <h2 className="font-medium">Tambah Wallet</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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

        <input
          className="rounded-lg border px-3 py-2"
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          disabled={disabled || submitting}
        />

        <input
          className="rounded-lg border px-3 py-2"
          placeholder="xpub (opsional)"
          value={xpub}
          onChange={(e) => setXpub(e.target.value)}
          disabled={disabled || submitting}
        />
      </div>

      <button
        type="submit"
        className="rounded-lg bg-black text-white px-4 py-2 disabled:opacity-50"
        disabled={disabled || submitting}
      >
        {submitting ? 'Menyimpan...' : 'Tambah'}
      </button>

      {msg && <p className="text-sm text-gray-600">{msg}</p>}
    </form>
  );
}
