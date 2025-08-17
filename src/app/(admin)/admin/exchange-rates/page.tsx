"use client";

import { useEffect, useState } from "react";
import { createExchangeRate, deleteExchangeRate, getExchangeRates, updateExchangeRate } from "@/lib/api/exchangeRate";
import CoinSelect from "@/components/coin-select";
import NetworkSelect from "@/components/network-select";

type RateRow = {
  id: string;
  rate: number;
  updatedBy?: string | null;
  updatedAt?: string;
  buyCoin: { id: string; symbol: string };
  buyNetwork: { id: string; symbol: string };
  payCoin: { id: string; symbol: string };
  payNetwork: { id: string; symbol: string };
};

const empty = {
  buyCoinId: "",
  buyNetworkId: "",
  payCoinId: "",
  payNetworkId: "",
  rate: "",
  updatedBy: "",
};

export default function AdminExchangeRatesPage() {
  const [rows, setRows] = useState<RateRow[]>([]);
  const [form, setForm] = useState<any>(empty);
  const [editing, setEditing] = useState<RateRow | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    const list = await getExchangeRates();
    setRows(Array.isArray(list) ? list : []);
  };

  useEffect(() => { refresh(); }, []);

  const onChange = (k: string, v: any) => setForm((s: any) => ({ ...s, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErr(null);
    try {
      const payload = {
        ...form,
        rate: Number(form.rate),
        updatedBy: form.updatedBy?.trim() || undefined,
      };
      if (editing) {
        await updateExchangeRate(editing.id, { rate: payload.rate, updatedBy: payload.updatedBy });
        setEditing(null);
      } else {
        await createExchangeRate(payload);
      }
      setForm(empty);
      await refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Gagal menyimpan");
    } finally { setLoading(false); }
  };

  const onEdit = (r: RateRow) => {
    setEditing(r);
    setForm({
      buyCoinId: r.buyCoin.id,
      buyNetworkId: r.buyNetwork.id,
      payCoinId: r.payCoin.id,
      payNetworkId: r.payNetwork.id,
      rate: r.rate,
      updatedBy: r.updatedBy ?? "",
    });
  };

  const onCancel = () => { setEditing(null); setForm(empty); };

  const onDelete = async (id: string) => {
    if (!confirm("Hapus exchange rate ini?")) return;
    setLoading(true); setErr(null);
    try {
      await deleteExchangeRate(id);
      await refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Gagal menghapus");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
      	<h1 className="text-xl font-semibold">Coins</h1>
      	<a href="/admin" className="text-sm text-blue-600 hover:underline">← Dashboard</a>
      </div>

      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
        <div>
          <label className="block text-sm mb-1">Buy Coin</label>
          <CoinSelect value={form.buyCoinId} onChange={(v) => onChange("buyCoinId", v)} valueKey="id" />
        </div>
        <div>
          <label className="block text-sm mb-1">Buy Network</label>
          <NetworkSelect value={form.buyNetworkId} onChange={(v) => onChange("buyNetworkId", v)} valueKey="id" />
        </div>
        <div>
          <label className="block text-sm mb-1">Pay Coin</label>
          <CoinSelect value={form.payCoinId} onChange={(v) => onChange("payCoinId", v)} valueKey="id" />
        </div>
        <div>
          <label className="block text-sm mb-1">Pay Network</label>
          <NetworkSelect value={form.payNetworkId} onChange={(v) => onChange("payNetworkId", v)} valueKey="id" />
        </div>
        <div>
          <label className="block text-sm mb-1">Rate</label>
          <input type="number" step="any" className="border rounded p-2 w-full" value={form.rate} onChange={(e) => onChange("rate", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Updated By (ops.)</label>
          <input className="border rounded p-2 w-full" value={form.updatedBy} onChange={(e) => onChange("updatedBy", e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>
            {editing ? "Simpan Perubahan" : "Tambah"}
          </button>
          {editing && <button type="button" className="border px-4 py-2 rounded ml-2" onClick={onCancel}>Batal</button>}
        </div>
      </form>

      {err && <div className="text-red-600 text-sm">{err}</div>}

      <div className="overflow-x-auto">
        <table className="min-w-full border rounded">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-2 border">Pair</th>
              <th className="p-2 border">Rate</th>
              <th className="p-2 border">Updated By</th>
              <th className="p-2 border">Updated At</th>
              <th className="p-2 border">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="p-2 border">
                  {r.buyCoin.symbol}/{r.payCoin.symbol} · {r.buyNetwork.symbol}/{r.payNetwork.symbol}
                </td>
                <td className="p-2 border">{r.rate}</td>
                <td className="p-2 border">{r.updatedBy || "—"}</td>
                <td className="p-2 border">{r.updatedAt ? new Date(r.updatedAt).toLocaleString() : "—"}</td>
                <td className="p-2 border space-x-2">
                  <button onClick={() => onEdit(r)} className="bg-blue-500 text-white px-2 py-1 rounded">Edit</button>
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
