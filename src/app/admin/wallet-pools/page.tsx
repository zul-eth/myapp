'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import type { WalletPoolRow } from '@/lib/api/walletPool';
import {
  listWalletPoolsAction,
  deriveWalletsAction,
  previewDerivedAddressAction,
} from '@/server/actions/wallets';

type Chain = 'evm' | 'tron' | 'solana';

export default function WalletPoolsAdminPage() {
  const [pending, startTransition] = useTransition();

  const [chain, setChain] = useState<Chain>('evm');
  const [rows, setRows] = useState<WalletPoolRow[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [cursor, setCursor] = useState<string | null>(null);

  const [count, setCount] = useState<number>(10);
  const [previewIndex, setPreviewIndex] = useState<number>(0);
  const [preview, setPreview] = useState<{ chain: string; index: number; address: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canLoadMore = useMemo(() => rows.length < total, [rows.length, total]);

  // initial load & when chain changes
  useEffect(() => {
    setRows([]);
    setCursor(null);
    setTotal(0);
    setError(null);
    startTransition(async () => {
      try {
        const res = await listWalletPoolsAction({ chain, take: 50, cursor: null });
        setRows(res.rows as any);
        setTotal(res.total);
        setCursor(res.nextCursor);
      } catch (e: any) {
        setError(e?.message ?? 'Gagal memuat data');
      }
    });
  }, [chain]);

  const loadMore = () => {
    if (!canLoadMore || pending) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await listWalletPoolsAction({ chain, take: 50, cursor });
        setRows(prev => [...prev, ...(res.rows as any)]);
        setTotal(res.total);
        setCursor(res.nextCursor);
      } catch (e: any) {
        setError(e?.message ?? 'Gagal memuat data');
      }
    });
  };

  const handleGenerate = () => {
    setError(null);
    startTransition(async () => {
      try {
        await deriveWalletsAction({ chain, count });
        // reload dari awal agar urutan terbaru muncul di atas
        const res = await listWalletPoolsAction({ chain, take: 50, cursor: null });
        setRows(res.rows as any);
        setTotal(res.total);
        setCursor(res.nextCursor);
      } catch (e: any) {
        setError(e?.message ?? 'Gagal generate address');
      }
    });
  };

  const handlePreview = () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await previewDerivedAddressAction({ chain, index: previewIndex });
        setPreview(res);
      } catch (e: any) {
        setError(e?.message ?? 'Gagal preview address');
      }
    });
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Wallet Pools</h1>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="flex items-center gap-2">
          <label className="w-24">Chain</label>
          <select
            className="border rounded px-2 py-1 bg-transparent"
            value={chain}
            onChange={(e) => setChain(e.target.value as Chain)}
          >
            <option value="evm">EVM</option>
            <option value="tron">TRON</option>
            <option value="solana">Solana</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="w-24">Derive</label>
          <input
            type="number"
            min={1}
            max={100}
            className="border rounded px-2 py-1 w-24 bg-transparent"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          />
          <button
            className="px-3 py-1 rounded border"
            disabled={pending}
            onClick={handleGenerate}
          >
            {pending ? 'Generating...' : 'Generate'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="w-24">Preview idx</label>
          <input
            type="number"
            min={0}
            className="border rounded px-2 py-1 w-24 bg-transparent"
            value={previewIndex}
            onChange={(e) => setPreviewIndex(Number(e.target.value))}
          />
          <button
            className="px-3 py-1 rounded border"
            disabled={pending}
            onClick={handlePreview}
          >
            {pending ? 'Checking...' : 'Preview'}
          </button>
        </div>
      </div>

      {preview && (
        <div className="text-xs border rounded p-3 overflow-x-auto">
          <div className="font-medium mb-1">Preview</div>
          <pre>{JSON.stringify(preview, null, 2)}</pre>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm opacity-80">
          Showing {rows.length} of {total} {chain.toUpperCase()} addresses
        </div>
        <button
          className="px-3 py-1 rounded border"
          onClick={loadMore}
          disabled={!canLoadMore || pending}
        >
          {pending ? 'Loading...' : (canLoadMore ? 'Load more' : 'No more')}
        </button>
      </div>

      {error && <div className="text-red-500 text-sm">{error}</div>}

      <div className="border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900">
            <tr>
              <th className="text-left p-2">Created</th>
              <th className="text-left p-2">Chain</th>
              <th className="text-left p-2">Index</th>
              <th className="text-left p-2">Address</th>
              <th className="text-left p-2">Used</th>
              <th className="text-left p-2">Assigned</th>
              <th className="text-left p-2">ID</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-zinc-800">
                <td className="p-2">{new Date(r.createdAt).toLocaleString()}</td>
                <td className="p-2">{r.chain}</td>
                <td className="p-2">{r.derivationIndex}</td>
                <td className="p-2 font-mono">{r.address}</td>
                <td className="p-2">{r.isUsed ? 'Yes' : 'No'}</td>
                <td className="p-2">{r.assignedOrder ?? '-'}</td>
                <td className="p-2 font-mono opacity-70">{r.id}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="p-6 text-center opacity-70" colSpan={7}>
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
