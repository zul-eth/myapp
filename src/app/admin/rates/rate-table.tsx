'use client';

import { useState } from 'react';
import type { ExchangeRate } from '@/types/exchangeRate';

type Props = {
  rows: ExchangeRate[];
  reloading?: boolean;
  onEditRate: (row: ExchangeRate, newRate: number) => Promise<void> | void;
  onDelete: (row: ExchangeRate) => Promise<void> | void;
};

export default function RateTable({ rows, reloading, onEditRate, onDelete }: Props) {
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const beginEdit = (r: ExchangeRate) => {
    setEditingId(r.id);
    setEditValue(String(r.rate));
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };
  const saveEdit = async (r: ExchangeRate) => {
    const val = Number(editValue);
    if (!Number.isFinite(val) || val <= 0) return alert('Masukkan rate yang valid');
    setWorkingId(r.id);
    try {
      await onEditRate(r, val);
      cancelEdit();
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <div className="rounded-xl border">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="font-medium">Daftar Rates</h2>
        {reloading && <span className="text-sm text-gray-500">Memuat...</span>}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-2">Buy</th>
              <th className="px-4 py-2">Pay</th>
              <th className="px-4 py-2">Rate</th>
              <th className="px-4 py-2">Diubah</th>
              <th className="px-4 py-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  Belum ada data
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-2">
                    <div className="font-medium">
                      {r.buyCoin.symbol} — {r.buyCoin.name}
                    </div>
                    <div className="text-gray-500">{r.buyNetwork.name}</div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="font-medium">
                      {r.payCoin.symbol} — {r.payCoin.name}
                    </div>
                    <div className="text-gray-500">{r.payNetwork.name}</div>
                  </td>
                  <td className="px-4 py-2">
                    {editingId === r.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="any"
                          min={0}
                          className="w-28 rounded-lg border px-2 py-1"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                        />
                        <button
                          className="rounded-lg border px-3 py-1 text-xs"
                          onClick={() => saveEdit(r)}
                          disabled={workingId === r.id}
                        >
                          Simpan
                        </button>
                        <button
                          className="rounded-lg border px-3 py-1 text-xs"
                          onClick={cancelEdit}
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <span className="font-mono">{r.rate}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <div className="text-xs text-gray-600">{r.updatedBy || '-'}</div>
                    <div className="text-xs text-gray-400">
                      {r.updatedAt ? new Date(r.updatedAt).toLocaleString() : '-'}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2 justify-end">
                      {editingId === r.id ? null : (
                        <button
                          className="rounded-lg border px-3 py-1 text-xs"
                          onClick={() => beginEdit(r)}
                        >
                          Edit Rate
                        </button>
                      )}
                      <button
                        className="rounded-lg border px-3 py-1 text-xs disabled:opacity-50"
                        onClick={() => onDelete(r)}
                        disabled={workingId === r.id}
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
