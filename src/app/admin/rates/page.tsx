'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Coin } from '@/types/coin';
import type { Network } from '@/types/network';
import type { ExchangeRate } from '@/types/exchangeRate';
import { getCoins } from '@/lib/api/coin';
import { getNetworks } from '@/lib/api/network';
import { getRates, createRate, updateRate, deleteRate } from '@/lib/api/rates';
import RateForm from './rate-form';
import RateTable from './rate-table';

export default function AdminRatesPage() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [networks, setNetworks] = useState<Network[]>([]);
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // filter & actor
  const [q, setQ] = useState('');
  const [actor, setActor] = useState<string>('admin'); // isi nama/email admin yg edit

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const [c, n, r] = await Promise.all([
        getCoins(),
        getNetworks(),
        getRates({ q: q || undefined }), // API GET /api/rates mengembalikan array ExchangeRate (include relasi)
      ]);
      setCoins(c);
      setNetworks(n);
      setRates(r);
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

  const visible = useMemo(() => rates, [rates]);

  const handleCreate = async (payload: {
    buyCoinId: string;
    buyNetworkId: string;
    payCoinId: string;
    payNetworkId: string;
    rate: number;
  }) => {
    await createRate({ ...payload, updatedBy: actor });
    await load();
  };

  const handleEditRate = async (row: ExchangeRate, newRate: number) => {
    await updateRate(row.id, { rate: newRate, updatedBy: actor });
    await load();
  };

  const handleDelete = async (row: ExchangeRate) => {
    if (
      !confirm(
        `Hapus rate ${row.buyCoin.symbol}/${row.buyNetwork.name} → ${row.payCoin.symbol}/${row.payNetwork.name}?`
      )
    )
      return;
    await deleteRate(row.id);
    await load();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Admin · Rates</h1>
          <p className="text-sm text-gray-500">
            Kelola rate pertukaran antar pasangan coin + network.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-lg border px-4 py-2 text-sm"
            onClick={load}
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </div>

      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {err}
        </div>
      )}

      {/* Filter & Actor */}
      <div className="rounded-xl border p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          className="rounded-lg border px-3 py-2"
          placeholder="Cari (coin, network, atau ID)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <input
          className="rounded-lg border px-3 py-2"
          placeholder="Diubah oleh (updatedBy)"
          value={actor}
          onChange={(e) => setActor(e.target.value)}
        />
        <div className="flex gap-2">
          <button className="rounded-lg border px-4 py-2" onClick={load} disabled={loading}>
            Terapkan
          </button>
          <button
            className="rounded-lg border px-4 py-2"
            onClick={() => {
              setQ('');
              setTimeout(load, 0);
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <RateForm coins={coins} networks={networks} onSubmit={handleCreate} disabled={loading} />

      <RateTable
        rows={visible}
        reloading={loading}
        onEditRate={handleEditRate}
        onDelete={handleDelete}
      />
    </div>
  );
}
