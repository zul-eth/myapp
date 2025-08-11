'use client';

import { CoinNetworkRelation } from '@/types/coinNetwork';
import { useState } from 'react';

type Props = {
  relations: CoinNetworkRelation[];
  reloading?: boolean;
  onToggle: (id: string, isActive: boolean) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
};

export default function CoinNetworkTable({ relations, reloading, onToggle, onDelete }: Props) {
  const [workingId, setWorkingId] = useState<string | null>(null);

  const handleToggle = async (r: CoinNetworkRelation) => {
    setWorkingId(r.id);
    try {
      await onToggle(r.id, !r.isActive);
    } finally {
      setWorkingId(null);
    }
  };

  const handleDelete = async (r: CoinNetworkRelation) => {
    if (!confirm(`Hapus relasi ${r.coin.symbol} ↔ ${r.network.name}?`)) return;
    setWorkingId(r.id);
    try {
      await onDelete(r.id);
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <div className="rounded-xl border">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="font-medium">Daftar Relasi</h2>
        {reloading && <span className="text-sm text-gray-500">Memuat...</span>}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-2">Coin</th>
              <th className="px-4 py-2">Network</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {relations.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  Belum ada relasi
                </td>
              </tr>
            )}
            {relations.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-2">
                  <div className="font-medium">{r.coin.symbol}</div>
                  <div className="text-gray-500">{r.coin.name}</div>
                </td>
                <td className="px-4 py-2">
                  <div className="font-medium">{r.network.name}</div>
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                      r.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {r.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <div className="flex gap-2 justify-end">
                    <button
                      className="rounded-lg border px-3 py-1 text-xs disabled:opacity-50"
                      onClick={() => handleToggle(r)}
                      disabled={workingId === r.id}
                    >
                      {workingId === r.id ? '...' : r.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                    <button
                      className="rounded-lg border px-3 py-1 text-xs disabled:opacity-50"
                      onClick={() => handleDelete(r)}
                      disabled={workingId === r.id}
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
