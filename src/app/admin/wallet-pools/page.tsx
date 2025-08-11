'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Coin } from '@/types/coin';
import type { Network } from '@/types/network';
import type { WalletPool } from '@/types/walletPool';
import { getCoins } from '@/lib/api/coin';
import { getNetworks } from '@/lib/api/network';
import {
  getWalletPools,
  createWalletPool,
  updateWalletPool,
  deleteWalletPool,
} from '@/lib/api/walletPool';
import WalletPoolForm from './WalletPoolForm';
import WalletPoolTable from './WalletPoolTable';

export default function WalletPoolsAdminPage() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [networks, setNetworks] = useState<Network[]>([]);
  const [rows, setRows] = useState<WalletPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // filters
  const [coinId, setCoinId] = useState('');
  const [networkId, setNetworkId] = useState('');
  const [isUsed, setIsUsed] = useState<'all' | 'true' | 'false'>('all');
  const [q, setQ] = useState('');

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const [c, n, r] = await Promise.all([
        getCoins(),
        getNetworks(),
        getWalletPools({
          coinId: coinId || undefined,
          networkId: networkId || undefined,
          isUsed: isUsed === 'all' ? undefined : isUsed,
          q: q || undefined,
          limit: 100,
        }),
      ]);
      setCoins(c);
      setNetworks(n);
      setRows(r);
    } catch (e: any) {
      setErr(e?.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = useMemo(() => rows, [rows]);

  const handleCreate = async (payload: {
    coinId: string;
    networkId: string;
    address: string;
    xpub?: string;
  }) => {
    await createWalletPool(payload);
    await load();
  };

  const handleToggleUsed = async (row: WalletPool) => {
    await updateWalletPool(row.id, { isUsed: !row.isUsed, assignedOrder: !row.isUsed ? row.assignedOrder ?? '' : null });
    await load();
  };

  const handleSetAssigned = async (row: WalletPool, assignedOrder: string | null) => {
    await updateWalletPool(row.id, { assignedOrder });
    await load();
  };

  const handleEdit = async (row: WalletPool, patch: { address?: string; xpub?: string }) => {
    await updateWalletPool(row.id, patch);
    await load();
  };

  const handleDelete = async (row: WalletPool) => {
    if (!confirm(`Hapus wallet ${row.address}?`)) return;
    await deleteWalletPool(row.id);
    await load();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Admin · Wallet Pool</h1>
          <p className="text-sm text-gray-500">Kelola daftar address yang siap dipakai.</p>
        </div>
        <button className="rounded-lg border px-4 py-2 text-sm" onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>

      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {err}
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <select
          className="rounded-lg border px-3 py-2"
          value={coinId}
          onChange={(e) => setCoinId(e.target.value)}
        >
          <option value="">Semua Coin</option>
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
        >
          <option value="">Semua Network</option>
          {networks.map((n) => (
            <option key={n.id} value={n.id}>
              {n.name}
            </option>
          ))}
        </select>

        <select
          className="rounded-lg border px-3 py-2"
          value={isUsed}
          onChange={(e) => setIsUsed(e.target.value as any)}
        >
          <option value="all">Semua (used & unused)</option>
          <option value="false">Hanya Unused</option>
          <option value="true">Hanya Used</option>
        </select>

        <input
          className="rounded-lg border px-3 py-2"
          placeholder="Cari (address/xpub/ID)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <div className="flex gap-2">
          <button className="rounded-lg border px-4 py-2" onClick={load} disabled={loading}>
            Terapkan
          </button>
          <button
            className="rounded-lg border px-4 py-2"
            onClick={() => {
              setCoinId('');
              setNetworkId('');
              setIsUsed('all');
              setQ('');
              setTimeout(load, 0);
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <WalletPoolForm
        coins={coins}
        networks={networks}
        onSubmit={handleCreate}
        disabled={loading}
      />

      <WalletPoolTable
        rows={visible}
        reloading={loading}
        onToggleUsed={handleToggleUsed}
        onSetAssigned={handleSetAssigned}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
