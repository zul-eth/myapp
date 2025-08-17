"use client";

import { useEffect, useState } from "react";
import { createCoinNetwork, deleteCoinNetwork, getCoinNetworks, toggleCoinNetworkActive, updateCoinNetwork } from "@/lib/api/coinNetwork";
import CoinSelect from "@/components/coin-select";
import NetworkSelect from "@/components/network-select";
import { AssetType, MemoKind } from "@prisma/client";

type Row = {
  id: string;
  isActive: boolean;
  assetType: keyof typeof AssetType | string;
  contractAddress?: string | null;
  decimals?: number | null;
  symbolOverride?: string | null;
  memoKind: keyof typeof MemoKind | string;
  memoLabel?: string | null;
  memoRegex?: string | null;
  coin: { id: string; symbol: string; name: string };
  network: { id: string; symbol: string; name: string };
};

const empty = {
  coinId: "",
  networkId: "",
  assetType: "NATIVE",
  contractAddress: "",
  decimals: 18 as number | string,
  symbolOverride: "",
  memoKind: "NONE",
  memoLabel: "",
  memoRegex: "",
};

export default function AdminCoinNetworksPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [form, setForm] = useState<any>(empty);
  const [editing, setEditing] = useState<Row | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    const list = await getCoinNetworks();
    setRows(Array.isArray(list) ? list : []);
  };

  useEffect(() => { refresh(); }, []);

  const onChange = (k: string, v: any) => setForm((s: any) => ({ ...s, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErr(null);
    const payload = {
      ...form,
      decimals: form.decimals === "" ? undefined : Number(form.decimals),
      contractAddress: form.contractAddress?.trim() || undefined,
      symbolOverride: form.symbolOverride?.trim() || undefined,
      memoLabel: form.memoLabel?.trim() || undefined,
      memoRegex: form.memoRegex?.trim() || undefined,
    };
    try {
      if (editing) {
        await updateCoinNetwork(editing.id, payload);
        setEditing(null);
      } else {
        await createCoinNetwork(payload);
      }
      setForm(empty);
      await refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Gagal menyimpan");
    } finally { setLoading(false); }
  };

  const onEdit = (r: Row) => {
    setEditing(r);
    setForm({
      coinId: r.coin.id,
      networkId: r.network.id,
      assetType: r.assetType,
      contractAddress: r.contractAddress ?? "",
      decimals: r.decimals ?? 18,
      symbolOverride: r.symbolOverride ?? "",
      memoKind: r.memoKind,
      memoLabel: r.memoLabel ?? "",
      memoRegex: r.memoRegex ?? "",
    });
  };

  const onCancel = () => { setEditing(null); setForm(empty); };

  const onToggle = async (id: string, current: boolean) => {
    setLoading(true); setErr(null);
    try {
      await toggleCoinNetworkActive(id, !current);
      await refresh();
    } catch (e: any) { setErr(e?.message ?? "Gagal mengubah status"); }
    finally { setLoading(false); }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Hapus relasi coin-network ini?")) return;
    setLoading(true); setErr(null);
    try {
      await deleteCoinNetwork(id);
      await refresh();
    } catch (e: any) { setErr(e?.message ?? "Gagal menghapus"); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
      	<h1 className="text-xl font-semibold">Coin Networks</h1>
      	<a href="/admin" className="text-sm text-blue-600 hover:underline">← Dashboard</a>
      </div>

      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
        <div className="col-span-2">
          <label className="block text-sm mb-1">Coin</label>
          <CoinSelect value={form.coinId} onChange={(v) => onChange("coinId", v)} valueKey="id" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm mb-1">Network</label>
          <NetworkSelect value={form.networkId} onChange={(v) => onChange("networkId", v)} valueKey="id" />
        </div>
        <div>
          <label className="block text-sm mb-1">Asset Type</label>
          <select className="border rounded p-2 w-full" value={form.assetType} onChange={(e) => onChange("assetType", e.target.value)}>
            {Object.keys(AssetType).map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Decimals</label>
          <input type="number" className="border rounded p-2 w-full" value={form.decimals} onChange={(e) => onChange("decimals", e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Contract Address (opsional)</label>
          <input className="border rounded p-2 w-full" value={form.contractAddress} onChange={(e) => onChange("contractAddress", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Symbol Override</label>
          <input className="border rounded p-2 w-full" value={form.symbolOverride} onChange={(e) => onChange("symbolOverride", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Memo Kind</label>
          <select className="border rounded p-2 w-full" value={form.memoKind} onChange={(e) => onChange("memoKind", e.target.value)}>
            {Object.keys(MemoKind).map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Memo Label</label>
          <input className="border rounded p-2 w-full" value={form.memoLabel} onChange={(e) => onChange("memoLabel", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Memo Regex</label>
          <input className="border rounded p-2 w-full" value={form.memoRegex} onChange={(e) => onChange("memoRegex", e.target.value)} />
        </div>
        <div className="md:col-span-2 flex gap-2">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>
            {editing ? "Simpan Perubahan" : "Tambah"}
          </button>
          {editing && <button type="button" onClick={onCancel} className="border px-4 py-2 rounded">Batal</button>}
        </div>
      </form>

      {err && <div className="text-red-600 text-sm">{err}</div>}

      <div className="overflow-x-auto">
        <table className="min-w-full border rounded">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-2 border">Coin</th>
              <th className="p-2 border">Network</th>
              <th className="p-2 border">Asset</th>
              <th className="p-2 border">Contract</th>
              <th className="p-2 border">Decimals</th>
              <th className="p-2 border">Memo</th>
              <th className="p-2 border">Active</th>
              <th className="p-2 border">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="p-2 border">{r.coin.symbol}</td>
                <td className="p-2 border">{r.network.symbol}</td>
                <td className="p-2 border">{r.assetType}</td>
                <td className="p-2 border">{r.contractAddress || "—"}</td>
                <td className="p-2 border">{r.decimals ?? "—"}</td>
                <td className="p-2 border">{r.memoKind}{r.memoLabel ? ` (${r.memoLabel})` : ""}</td>
                <td className="p-2 border">{r.isActive ? "Yes" : "No"}</td>
                <td className="p-2 border space-x-2">
                  <button onClick={() => onEdit(r)} className="bg-blue-500 text-white px-2 py-1 rounded">Edit</button>
                  <button onClick={() => onToggle(r.id, r.isActive)} className={`${r.isActive ? "bg-yellow-500" : "bg-green-600"} text-white px-2 py-1 rounded`}>
                    {r.isActive ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                  <button onClick={() => onDelete(r.id)} className="bg-red-600 text-white px-2 py-1 rounded">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
