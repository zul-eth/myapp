'use client';

import { useEffect, useMemo, useState } from 'react';
import type { WalletPool } from '@/types/walletPool';
import { getWalletPools, deriveWallets, updateWalletPool, deleteWalletPool } from '@/lib/api/walletPool';

export default function WalletPoolsAdminPage() {
  const [rows, setRows] = useState<WalletPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // filter
  const [chain, setChain] = useState<'' | 'evm' | 'tron' | 'solana'>('');
  const [isUsed, setIsUsed] = useState<'all' | 'true' | 'false'>('all');
  const [q, setQ] = useState('');
  const [count, setCount] = useState(1);

  const load = async () => {
    setLoading(true); setErr(null);
    try {
      const list = await getWalletPools({
        chain: chain || undefined,
        isUsed: isUsed === 'all' ? undefined : isUsed,
        q: q || undefined,
        limit: 200,
      });
      setRows(list);
    } catch (e: any) {
      setErr(e?.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const visible = useMemo(() => rows, [rows]);

  const handleGenerate = async () => {
    if (!chain) return alert('Pilih chain');
    await deriveWallets({ chain, count });
    await load();
  };

  const handleToggleUsed = async (row: WalletPool) => {
    await updateWalletPool(row.id, { isUsed: !row.isUsed, assignedOrder: !row.isUsed ? row.assignedOrder ?? '' : null });
    await load();
  };

  const handleAssign = async (row: WalletPool, assignedOrder: string | null) => {
    await updateWalletPool(row.id, { assignedOrder });
    await load();
  };

  const handleDelete = async (row: WalletPool) => {
    if (!confirm(`Hapus ${row.address}?`)) return;
    await deleteWalletPool(row.id);
    await load();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Admin · Wallet Ledger</h1>
          <p className="text-sm text-gray-500">Ledger per-chain (HdCursor). Alokasi address otomatis saat membuat order.</p>
        </div>
        <button className="rounded-lg border px-4 py-2 text-sm" onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>

      {err && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{err}</div>}

      {/* Filter + Generator */}
      <div className="rounded-xl border p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <select className="rounded-lg border px-3 py-2" value={chain} onChange={(e) => setChain(e.target.value as any)}>
          <option value="">Semua Chain</option>
          <option value="evm">EVM</option>
          <option value="tron">TRON</option>
          <option value="solana">Solana</option>
        </select>
        <select className="rounded-lg border px-3 py-2" value={isUsed} onChange={(e) => setIsUsed(e.target.value as any)}>
          <option value="all">Semua (used & unused)</option>
          <option value="false">Hanya Unused</option>
          <option value="true">Hanya Used</option>
        </select>
        <input className="rounded-lg border px-3 py-2" placeholder="Cari (address/OrderID/ID)" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="flex gap-2">
          <button className="rounded-lg border px-4 py-2" onClick={load} disabled={loading}>Terapkan</button>
          <button className="rounded-lg border px-4 py-2" onClick={() => { setChain(''); setIsUsed('all'); setQ(''); setTimeout(load, 0); }}>Reset</button>
        </div>
        <div className="flex items-center gap-2">
          <input type="number" min={1} max={100} className="rounded-lg border px-3 py-2 w-24" value={count} onChange={(e) => setCount(Number(e.target.value))} />
          <button className="rounded-lg bg-black text-white px-4 py-2 disabled:opacity-50" onClick={handleGenerate} disabled={loading || !chain}>
            Generate {count}
          </button>
        </div>
      </div>

      <WalletLedgerTable rows={visible} reloading={loading} onToggleUsed={handleToggleUsed} onAssign={handleAssign} onDelete={handleDelete} />
    </div>
  );
}

// --- Table component (inline biar 1 file) ---
function WalletLedgerTable({
  rows,
  reloading,
  onToggleUsed,
  onAssign,
  onDelete,
}: {
  rows: WalletPool[];
  reloading?: boolean;
  onToggleUsed: (row: WalletPool) => Promise<void> | void;
  onAssign: (row: WalletPool, assignedOrder: string | null) => Promise<void> | void;
  onDelete: (row: WalletPool) => Promise<void> | void;
}) {
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [assignValue, setAssignValue] = useState('');

  const beginAssign = (r: WalletPool) => { setAssigningId(r.id); setAssignValue(r.assignedOrder || ''); };
  const cancelAssign = () => { setAssigningId(null); setAssignValue(''); };
  const saveAssign = async (r: WalletPool) => {
    setWorkingId(r.id);
    try { await onAssign(r, assignValue.trim() || null); cancelAssign(); }
    finally { setWorkingId(null); }
  };

  return (
    <div className="rounded-xl border">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="font-medium">Ledger</h2>
        {reloading && <span className="text-sm text-gray-500">Memuat...</span>}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-2">Chain</th>
              <th className="px-4 py-2">Index</th>
              <th className="px-4 py-2">Address</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Assigned Order</th>
              <th className="px-4 py-2">Dibuat</th>
              <th className="px-4 py-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Belum ada data</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-2 uppercase">{r.chain}</td>
                  <td className="px-4 py-2 font-mono">{r.derivationIndex}</td>
                  <td className="px-4 py-2 break-all font-mono">{r.address}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${r.isUsed ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-700'}`}>
                      {r.isUsed ? 'Used' : 'Unused'}
                    </span>
                  </td>
                  <td className="px-4 py-2 break-all">
                    {assigningId === r.id ? (
                      <div className="flex items-center gap-2">
                        <input className="rounded-lg border px-2 py-1 w-48" value={assignValue} onChange={(e) => setAssignValue(e.target.value)} placeholder="Order ID (opsional)" />
                        <button className="rounded-lg border px-3 py-1 text-xs" onClick={() => saveAssign(r)} disabled={workingId === r.id}>Simpan</button>
                        <button className="rounded-lg border px-3 py-1 text-xs" onClick={cancelAssign}>Batal</button>
                      </div>
                    ) : (
                      <span className="font-mono text-xs">{r.assignedOrder || '-'}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">{r.createdAt ? new Date(r.createdAt).toLocaleString() : '-'}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2 justify-end">
                      {assigningId === r.id ? null : (
                        <button className="rounded-lg border px-3 py-1 text-xs" onClick={() => beginAssign(r)}>
                          Assign Order
                        </button>
                      )}
                      <button
                        className="rounded-lg border px-3 py-1 text-xs disabled:opacity-50"
                        onClick={async () => { setWorkingId(r.id); try { await onToggleUsed(r); } finally { setWorkingId(null); } }}
                        disabled={workingId === r.id}
                        title={r.isUsed ? 'Set Unused' : 'Set Used'}
                      >
                        {workingId === r.id ? '...' : r.isUsed ? 'Set Unused' : 'Set Used'}
                      </button>
                      <button
                        className="rounded-lg border px-3 py-1 text-xs disabled:opacity-50"
                        onClick={() => onDelete(r)}
                        disabled={r.isUsed || workingId === r.id}
                        title={r.isUsed ? 'Tidak bisa hapus yang digunakan' : 'Hapus'}
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
