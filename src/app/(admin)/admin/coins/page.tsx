"use client";

import { useEffect, useMemo, useState } from "react";
import { createCoin, deleteCoin, getCoins, toggleCoinActive, updateCoin } from "@/lib/api/coin";

type Coin = {
  id: string;
  symbol: string;
  name: string;
  logoUrl?: string | null;
  isActive: boolean;
  createdAt: string;
};

const emptyForm = { symbol: "", name: "", logoUrl: "" };

export default function AdminCoinsPage() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [editing, setEditing] = useState<Coin | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const title = useMemo(() => (editing ? "Edit Coin" : "Tambah Coin"), [editing]);

  const refresh = async () => {
    const list = await getCoins();
    setCoins(Array.isArray(list) ? list : []);
  };

  useEffect(() => {
    refresh();
  }, []);

  const onChange = (k: keyof typeof emptyForm, v: string) => setForm((s) => ({ ...s, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      if (editing) {
        await updateCoin(editing.id, { ...form });
      } else {
        await createCoin({ ...form });
      }
      setForm(emptyForm);
      setEditing(null);
      await refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  };

  const onEdit = (c: Coin) => {
    setEditing(c);
    setForm({
      symbol: c.symbol,
      name: c.name,
      logoUrl: c.logoUrl ?? "",
    });
  };

  const onCancel = () => {
    setEditing(null);
    setForm(emptyForm);
    setErr(null);
  };

  const onToggle = async (id: string, current: boolean) => {
    setLoading(true);
    setErr(null);
    try {
      await toggleCoinActive(id, !current);
      await refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Gagal mengubah status");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Hapus coin ini beserta seluruh relasinya?")) return;
    setLoading(true);
    setErr(null);
    try {
      await deleteCoin(id);
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
      	<h1 className="text-xl font-semibold">Coins</h1>
      	<a href="/admin" className="text-sm text-blue-600 hover:underline">← Dashboard</a>
      </div>

      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
        <div className="col-span-1">
          <label className="block text-sm mb-1">Symbol</label>
          <input
            className="border rounded p-2 w-full"
            placeholder="BTC"
            value={form.symbol}
            onChange={(e) => onChange("symbol", e.target.value.toUpperCase())}
          />
        </div>
        <div className="col-span-1">
          <label className="block text-sm mb-1">Name</label>
          <input
            className="border rounded p-2 w-full"
            placeholder="Bitcoin"
            value={form.name}
            onChange={(e) => onChange("name", e.target.value)}
          />
        </div>
        <div className="col-span-1">
          <label className="block text-sm mb-1">Logo URL (opsional)</label>
          <input
            className="border rounded p-2 w-full"
            placeholder="https://…/btc.png"
            value={form.logoUrl}
            onChange={(e) => onChange("logoUrl", e.target.value)}
          />
        </div>
        <div className="col-span-1 flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            {editing ? "Simpan Perubahan" : "Tambah"}
          </button>
          {editing && (
            <button type="button" onClick={onCancel} className="border px-4 py-2 rounded">
              Batal
            </button>
          )}
        </div>
      </form>

      {err && <div className="text-red-600 text-sm">{err}</div>}

      <div className="overflow-x-auto">
        <table className="min-w-full border rounded">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-2 border">Symbol</th>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Logo</th>
              <th className="p-2 border">Active</th>
              <th className="p-2 border">Created</th>
              <th className="p-2 border">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {coins.map((c) => (
              <tr key={c.id}>
                <td className="p-2 border font-mono">{c.symbol}</td>
                <td className="p-2 border">{c.name}</td>
                <td className="p-2 border">
                  {c.logoUrl ? <img src={c.logoUrl} alt={c.symbol} className="h-6 w-6" /> : <span className="text-gray-400">—</span>}
                </td>
                <td className="p-2 border">{c.isActive ? "Yes" : "No"}</td>
                <td className="p-2 border text-sm">{new Date(c.createdAt).toLocaleString()}</td>
                <td className="p-2 border space-x-2">
                  <button onClick={() => onEdit(c)} className="bg-blue-500 text-white px-2 py-1 rounded">Edit</button>
                  <button
                    onClick={() => onToggle(c.id, c.isActive)}
                    className={`${c.isActive ? "bg-yellow-500" : "bg-green-600"} text-white px-2 py-1 rounded`}
                  >
                    {c.isActive ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                  <button onClick={() => onDelete(c.id)} className="bg-red-600 text-white px-2 py-1 rounded">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
