// src/app/admin/coins/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getCoins } from '@/lib/api/coin';
import CoinTable from './CoinTable';
import CoinForm from './CoinForm';
import { Coin } from '@/types/coin';

export default function CoinPage() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editCoin, setEditCoin] = useState<Coin | null>(null);

  const loadCoins = async () => {
    const data = await getCoins();
    setCoins(data);
  };

  const handleEdit = (coin: Coin) => {
    setEditCoin(coin);
    setShowForm(true);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setEditCoin(null);
    loadCoins();
  };

  const handleAddNew = () => {
    setEditCoin(null);
    setShowForm(true);
  };

  useEffect(() => {
    loadCoins();
  }, []);

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Coin Management</h1>
      <button
        className="text-sm text-blue-600 underline mb-4"
        onClick={handleAddNew}
      >
        + Tambah Coin
      </button>

      {showForm && (
        <CoinForm
          initialData={editCoin}
          onSuccess={handleSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditCoin(null);
          }}
        />
      )}

      <CoinTable coins={coins} onEdit={handleEdit} onRefresh={loadCoins} />
    </div>
  );
}