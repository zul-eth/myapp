"use client";

import { useEffect, useState } from "react";
import { createNetwork, deleteNetwork, getNetworks, toggleNetworkActive, updateNetwork } from "@/lib/api/network";
import { ChainFamily } from "@prisma/client";

type Network = {
  id: string;
  symbol: string;
  name: string;
  family: keyof typeof ChainFamily | string;
  isActive: boolean;
};

const empty = { symbol: "", name: "", family: "EVM" as any };

export default function AdminNetworksPage() {
  const [items, setItems] = useState<Network[]>([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<Network | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    const list = await getNetworks();
    setItems(Array.isArray(list) ? list : []);
  };

  useEffect(() => {
    refresh();
  }, []);

  const onChange = (k: keyof typeof empty, v: string) => setForm((s) => ({ ...s, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErr(null);
    try {
      if (editing) {
        await updateNetwork(editing.id, form);
        setEditing(null);
      } else {
        await createNetwork(form);
      }
      setForm(empty);
      await refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  };

  const onEdit = (n: Network) => {
    setEditing(n);
    setForm({ symbol: n.symbol, name: n.name, family: n.family as any });
  };

  const onCancel = () => {
    setEditing(null);
    setForm(empty);
  };

  const onToggle = async (id: string, current: boolean) => {
    setLoading(true); setErr(null);
    try {
      await toggleNetworkActive(id, !current);
      await refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Gagal mengubah status");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Hapus network ini beserta relasi dependent?")) return;
    setLoading(true); setErr(null);
    try {
      await deleteNetwork(id);
      await refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Gagal menghapus");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
      	<h1 className="text-xl font-semibold">Networks</h1>
      	<a href="/admin" className="text-sm text-blue-600 hover:underline">← Dashboard</a>
      </div>

      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
        <div>
          <label className="block text-sm mb-1">Symbol</label>
          <input className="border rounded p-2 w-full" placeholder="ETH" value={form.symbol} onChange={(e) => onChange("symbol", e.target.value.toUpperCase())}/>
        </div>
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input className="border rounded p-2 w-full" placeholder="Ethereum" value={form.name} onChange={(e) => onChange("name", e.target.value)}/>
        </div>
        <div>
          <label className="block text-sm mb-1">Family</label>
          <select className="border rounded p-2 w-full" value={form.family} onChange={(e) => onChange("family", e.target.value)}>
            {Object.keys(ChainFamily).map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div className="flex gap-2 md:col-span-2">
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
            {editing ? "Simpan Perubahan" : "Tambah"}
          </button>
          {editing && <button type="button" className="border px-4 py-2 rounded" onClick={onCancel}>Batal</button>}
        </div>
      </form>

      {err && <div className="text-red-600 text-sm">{err}</div>}

      <div className="overflow-x-auto">
        <table className="min-w-full border rounded">
          <thead><tr className="bg-gray-50 text-left">
            <th className="p-2 border">Symbol</th>
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Family</th>
            <th className="p-2 border">Active</th>
            <th className="p-2 border">Aksi</th>
          </tr></thead>
          <tbody>
            {items.map((n) => (
              <tr key={n.id}>
                <td className="p-2 border font-mono">{n.symbol}</td>
                <td className="p-2 border">{n.name}</td>
                <td className="p-2 border">{String(n.family)}</td>
                <td className="p-2 border">{n.isActive ? "Yes" : "No"}</td>
                <td className="p-2 border space-x-2">
                  <button onClick={() => onEdit(n)} className="bg-blue-500 text-white px-2 py-1 rounded">Edit</button>
                  <button onClick={() => onToggle(n.id, n.isActive)} className={`${n.isActive ? "bg-yellow-500" : "bg-green-600"} text-white px-2 py-1 rounded`}>
                    {n.isActive ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                  <button onClick={() => onDelete(n.id)} className="bg-red-600 text-white px-2 py-1 rounded">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
