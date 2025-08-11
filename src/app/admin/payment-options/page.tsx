'use client';

import { useEffect, useState } from 'react';
import type { Coin } from '@/types/coin';
import type { Network } from '@/types/network';
import type { PaymentOption } from '@/types/paymentOption';
import { getCoins } from '@/lib/api/coin';
import { getNetworks } from '@/lib/api/network';
import {
  getPaymentOptions,
  createPaymentOption,
  setPaymentOptionActive,
  deletePaymentOption,
} from '@/lib/api/paymentOption';
import PaymentOptionForm from './PaymentOptionForm';
import PaymentOptionTable from './PaymentOptionTable';

export default function PaymentOptionsPage() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [networks, setNetworks] = useState<Network[]>([]);
  const [options, setOptions] = useState<PaymentOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, n, p] = await Promise.all([
        getCoins(),
        getNetworks(),
        getPaymentOptions(),
      ]);
      setCoins(c);
      setNetworks(n);
      setOptions(p);
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
    await createPaymentOption(coinId, networkId);
    await loadAll();
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await setPaymentOptionActive(id, isActive);
    await loadAll(); // catatan: setelah dinonaktifkan, item akan hilang dari tabel (GET hanya yang aktif)
  };

  const handleDelete = async (id: string) => {
    await deletePaymentOption(id);
    await loadAll();
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin · Payment Options</h1>
        <p className="text-sm text-gray-500">
          Kelola kombinasi coin + network yang tersedia untuk pembayaran.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      <PaymentOptionForm
        coins={coins}
        networks={networks}
        onSubmit={handleCreate}
        disabled={loading}
      />

      <PaymentOptionTable
        options={options}
        reloading={loading}
        onToggle={handleToggle}
        onDelete={handleDelete}
      />
    </div>
  );
}
