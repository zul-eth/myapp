'use client';

import { useEffect, useState } from 'react';
import { Coin } from '@/types/coin';
import { Network } from '@/types/network';
import { CoinNetworkRelation } from '@/types/coinNetwork';
import { getCoins } from '@/lib/api/coin';
import { getNetworks } from '@/lib/api/network';
import { getRelations, createRelation, toggleRelation, deleteRelation } from '@/lib/api/coinNetwork';
import CoinNetworkForm from './CoinNetworkForm';
import CoinNetworkTable from './CoinNetworkTable';

export default function CoinNetworkPage() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [networks, setNetworks] = useState<Network[]>([]);
  const [relations, setRelations] = useState<CoinNetworkRelation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, n, r] = await Promise.all([getCoins(), getNetworks(), getRelations()]);
      setCoins(c);
      setNetworks(n);
      setRelations(r);
    } catch (e: any) {
      setError(e?.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleCreate = async (coinId: string, networkId: string) => {
    await createRelation(coinId, networkId);
    await loadAll();
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await toggleRelation(id, isActive);
    await loadAll();
  };

  const handleDelete = async (id: string) => {
    await deleteRelation(id);
    await loadAll();
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin · Coin ↔ Network</h1>
        <p className="text-sm text-gray-500">Kelola relasi antara coin dan network.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      <CoinNetworkForm
        coins={coins}
        networks={networks}
        onSubmit={handleCreate}
        disabled={loading}
      />

      <CoinNetworkTable
        relations={relations}
        onToggle={handleToggle}
        onDelete={handleDelete}
        reloading={loading}
      />
    </div>
  );
}
