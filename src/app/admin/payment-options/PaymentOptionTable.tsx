'use client';

import { useState } from 'react';
import type { PaymentOption } from '@/types/paymentOption';

type Props = {
  options: PaymentOption[];
  reloading?: boolean;
  onToggle: (id: string, isActive: boolean) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
};

export default function PaymentOptionTable({ options, reloading, onToggle, onDelete }: Props) {
  const [workingId, setWorkingId] = useState<string | null>(null);

  const handleToggle = async (opt: PaymentOption) => {
    setWorkingId(opt.id);
    try {
      await onToggle(opt.id, !opt.isActive);
    } finally {
      setWorkingId(null);
    }
  };

  const handleDelete = async (opt: PaymentOption) => {
    if (!confirm(`Hapus metode pembayaran ${opt.coin.symbol} di ${opt.network.name}?`)) return;
    setWorkingId(opt.id);
    try {
      await onDelete(opt.id);
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <div className="rounded-xl border">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="font-medium">Daftar Payment Options (aktif)</h2>
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
            {options.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  Belum ada payment option aktif
                </td>
              </tr>
            )}
            {options.map((opt) => (
              <tr key={opt.id} className="border-t">
                <td className="px-4 py-2">
                  <div className="font-medium">{opt.coin.symbol}</div>
                  <div className="text-gray-500">{opt.coin.name}</div>
                </td>
                <td className="px-4 py-2">
                  <div className="font-medium">{opt.network.name}</div>
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                      opt.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {opt.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <div className="flex gap-2 justify-end">
                    <button
                      className="rounded-lg border px-3 py-1 text-xs disabled:opacity-50"
                      onClick={() => handleToggle(opt)}
                      disabled={workingId === opt.id}
                      title={opt.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    >
                      {workingId === opt.id ? '...' : opt.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                    <button
                      className="rounded-lg border px-3 py-1 text-xs disabled:opacity-50"
                      onClick={() => handleDelete(opt)}
                      disabled={workingId === opt.id}
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
      <p className="px-4 py-3 text-xs text-gray-500">
        Catatan: endpoint GET hanya mengembalikan opsi <b>aktif</b>. Jika kamu menonaktifkan
        sebuah opsi, item akan hilang dari tabel ini sampai diaktifkan lagi (via PUT dengan ID-nya).
      </p>
    </div>
  );
}
