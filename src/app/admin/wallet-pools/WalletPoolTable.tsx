'use client';

import { useState } from 'react';
import type { WalletPool } from '@/types/walletPool';

type Props = {
  rows: WalletPool[];
  reloading?: boolean;
  onToggleUsed: (row: WalletPool) => Promise<void> | void;
  onSetAssigned: (row: WalletPool, assignedOrder: string | null) => Promise<void> | void;
  onEdit: (row: WalletPool, patch: { address?: string; xpub?: string }) => Promise<void> | void;
  onDelete: (row: WalletPool) => Promise<void> | void;
};

export default function WalletPoolTable({
  rows,
  reloading,
  onToggleUsed,
  onSetAssigned,
  onEdit,
  onDelete,
}: Props) {
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAddress, setEditAddress] = useState('');
  const [editXpub, setEditXpub] = useState('');
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [assignValue, setAssignValue] = useState('');

  const beginEdit = (r: WalletPool) => {
    setEditingId(r.id);
    setEditAddress(r.address);
    setEditXpub(r.xpub || '');
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditAddress('');
    setEditXpub('');
  };
  const saveEdit = async (r: WalletPool) => {
    setWorkingId(r.id);
    try {
      const patch: any = {};
      if (editAddress !== r.address) patch.address = editAddress;
      if ((editXpub || '') !== (r.xpub || '')) patch.xpub = editXpub || null;
      if (Object.keys(patch).length === 0) return cancelEdit();
      await onEdit(r, patch);
      cancelEdit();
    } finally {
      setWorkingId(null);
    }
  };

  const beginAssign = (r: WalletPool) => {
    setAssigningId(r.id);
    setAssignValue(r.assignedOrder || '');
  };
  const cancelAssign = () => {
    setAssigningId(null);
    setAssignValue('');
  };
  const saveAssign = async (r: WalletPool) => {
    setWorkingId(r.id);
    try {
      await onSetAssigned(r, assignValue.trim() || null);
      cancelAssign();
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <div className="rounded-xl border">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="font-medium">Daftar Wallet</h2>
        {reloading && <span className="text-sm text-gray-500">Memuat...</span>}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-2">Coin</th>
              <th className="px-4 py-2">Network</th>
              <th className="px-4 py-2">Address</th>
              <th className="px-4 py-2">XPUB</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Assigned Order</th>
              <th className="px-4 py-2">Dibuat</th>
              <th className="px-4 py-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  Belum ada data
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-2">
                    <div className="font-medium">{r.coin.symbol}</div>
                    <div className="text-gray-500">{r.coin.name}</div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="font-medium">{r.network.name}</div>
                  </td>
                  <td className="px-4 py-2 break-all">
                    {editingId === r.id ? (
                      <input
                        className="rounded-lg border px-2 py-1 w-64"
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                      />
                    ) : (
                      <code className="font-mono">{r.address}</code>
                    )}
                  </td>
                  <td className="px-4 py-2 break-all">
                    {editingId === r.id ? (
                      <input
                        className="rounded-lg border px-2 py-1 w-56"
                        value={editXpub}
                        onChange={(e) => setEditXpub(e.target.value)}
                      />
                    ) : (
                      <span className="font-mono text-xs">{r.xpub || '-'}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                        r.isUsed ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {r.isUsed ? 'Used' : 'Unused'}
                    </span>
                  </td>
                  <td className="px-4 py-2 break-all">
                    {assigningId === r.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          className="rounded-lg border px-2 py-1 w-48"
                          value={assignValue}
                          onChange={(e) => setAssignValue(e.target.value)}
                          placeholder="Order ID (opsional)"
                        />
                        <button
                          className="rounded-lg border px-3 py-1 text-xs"
                          onClick={() => saveAssign(r)}
                          disabled={workingId === r.id}
                        >
                          Simpan
                        </button>
                        <button className="rounded-lg border px-3 py-1 text-xs" onClick={cancelAssign}>
                          Batal
                        </button>
                      </div>
                    ) : (
                      <span className="font-mono text-xs">{r.assignedOrder || '-'}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {r.createdAt ? new Date(r.createdAt).toLocaleString() : '-'}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2 justify-end">
                      {editingId === r.id ? (
                        <>
                          <button
                            className="rounded-lg border px-3 py-1 text-xs"
                            onClick={() => saveEdit(r)}
                            disabled={workingId === r.id}
                          >
                            Simpan
                          </button>
                          <button className="rounded-lg border px-3 py-1 text-xs" onClick={cancelEdit}>
                            Batal
                          </button>
                        </>
                      ) : (
                        <button
                          className="rounded-lg border px-3 py-1 text-xs"
                          onClick={() => beginEdit(r)}
                        >
                          Edit
                        </button>
                      )}

                      <button
                        className="rounded-lg border px-3 py-1 text-xs disabled:opacity-50"
                        onClick={async () => {
                          setWorkingId(r.id);
                          try {
                            await onToggleUsed(r);
                          } finally {
                            setWorkingId(null);
                          }
                        }}
                        disabled={workingId === r.id}
                        title={r.isUsed ? 'Tandai Unused' : 'Tandai Used'}
                      >
                        {workingId === r.id ? '...' : r.isUsed ? 'Set Unused' : 'Set Used'}
                      </button>

                      {assigningId === r.id ? null : (
                        <button
                          className="rounded-lg border px-3 py-1 text-xs"
                          onClick={() => beginAssign(r)}
                        >
                          Assign Order
                        </button>
                      )}

                      <button
                        className="rounded-lg border px-3 py-1 text-xs disabled:opacity-50"
                        onClick={() => onDelete(r)}
                        disabled={r.isUsed || workingId === r.id}
                        title={r.isUsed ? 'Tidak bisa hapus wallet yang digunakan' : 'Hapus wallet'}
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
