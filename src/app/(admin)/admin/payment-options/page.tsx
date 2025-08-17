"use client";

import { useEffect, useMemo, useState } from "react";
import CoinSelect from "@/components/coin-select";
import NetworkSelect from "@/components/network-select";
import {
  createPaymentOption,
  deletePaymentOption,
  getPaymentOptions,
  togglePaymentOptionActive,
  updatePaymentOption,
} from "@/lib/api/paymentOption";

type Row = {
  id: string;
  isActive: boolean;
  createdAt?: string;
  coin: { id: string; symbol: string; name: string };
  network: { id: string; symbol: string; name: string };
};

const empty = {
  coinId: "",
  networkId: "",
  isActive: true,
};

const PAGE_SIZES = [10, 20, 50];

export default function AdminPaymentOptionsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [form, setForm] = useState<any>(empty);
  const [editing, setEditing] = useState<Row | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // toolbar state
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0]);

  const refresh = async () => {
    const list = await getPaymentOptions();
    setRows(Array.isArray(list) ? list : []);
  };

  useEffect(() => {
    refresh();
  }, []);

  const onChange = (k: string, v: any) => setForm((s: any) => ({ ...s, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErr(null);
    try {
      if (editing) {
        await updatePaymentOption(editing.id, { isActive: form.isActive });
        setEditing(null);
      } else {
        await createPaymentOption({
          coinId: form.coinId,
          networkId: form.networkId,
          isActive: !!form.isActive,
        });
      }
      setForm(empty);
      await refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  };

  const onEdit = (r: Row) => {
    setEditing(r);
    setForm({
      coinId: r.coin.id,
      networkId: r.network.id,
      isActive: r.isActive,
    });
  };

  const onCancel = () => {
    setEditing(null);
    setForm(empty);
  };

  const onToggle = async (id: string, current: boolean) => {
    setLoading(true); setErr(null);
    try {
      await togglePaymentOptionActive(id, !current);
      await refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Gagal mengubah status");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Hapus payment option ini?")) return;
    setLoading(true); setErr(null);
    try {
      await deletePaymentOption(id);
      await refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Gagal menghapus");
    } finally {
      setLoading(false);
    }
  };

  // ==== FILTER & PAGINATION (client-side) ====
  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const k = q.trim().toLowerCase();
    return rows.filter((r) => {
      const values = [
        r.coin.symbol, r.coin.name,
        r.network.symbol, r.network.name,
        r.isActive ? "active" : "inactive",
      ].map((x) => String(x ?? "").toLowerCase());
      return values.some((v) => v.includes(k));
    });
  }, [rows, q]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const visible = filtered.slice(start, start + pageSize);

  useEffect(() => { setPage(1); }, [q, pageSize]); // reset page saat filter berubah

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Payment Options</h1>
        <a href="/admin" className="text-sm text-blue-600 hover:underline">← Dashboard</a>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Coin</label>
          <CoinSelect value={form.coinId} onChange={(v) => onChange("coinId", v)} valueKey="id" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Network</label>
          <NetworkSelect value={form.networkId} onChange={(v) => onChange("networkId", v)} valueKey="id" />
        </div>
        <div>
          <label className="block text-sm mb-1">Active?</label>
          <select
            className="border rounded p-2 w-full"
            value={String(form.isActive)}
            onChange={(e) => onChange("isActive", e.target.value === "true")}
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>

        <div className="md:col-span-5 flex gap-2">
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
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

      {/* Toolbar Tabel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2">
          <input
            className="border rounded p-2 w-64"
            placeholder="Cari coin/network…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="text-sm px-2 py-1 border rounded hover:bg-gray-50"
            >
              Reset
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-500">Total: <b>{total}</b></span>
          <label className="inline-flex items-center gap-2">
            <span>Per page</span>
            <select
              className="border rounded p-1"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2 py-1 border rounded disabled:opacity-50"
            >
              ‹ Prev
            </button>
            <span className="px-2">
              Page <b>{currentPage}</b> / {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-2 py-1 border rounded disabled:opacity-50"
            >
              Next ›
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border rounded text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-2 border">Coin</th>
              <th className="p-2 border">Network</th>
              <th className="p-2 border">Active</th>
              <th className="p-2 border">Created</th>
              <th className="p-2 border">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.id}>
                <td className="p-2 border">{r.coin.symbol} <span className="text-gray-500">· {r.coin.name}</span></td>
                <td className="p-2 border">{r.network.symbol} <span className="text-gray-500">· {r.network.name}</span></td>
                <td className="p-2 border">{r.isActive ? "Yes" : "No"}</td>
                <td className="p-2 border">{r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}</td>
                <td className="p-2 border space-x-2">
                  <button onClick={() => onEdit(r)} className="bg-blue-500 text-white px-2 py-1 rounded">Edit</button>
                  <button
                    onClick={() => onToggle(r.id, r.isActive)}
                    className={`${r.isActive ? "bg-yellow-500" : "bg-green-600"} text-white px-2 py-1 rounded`}
                  >
                    {r.isActive ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                  <button onClick={() => onDelete(r.id)} className="bg-red-600 text-white px-2 py-1 rounded">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {visible.length === 0 && (
          <div className="text-sm text-gray-500 p-2">Tidak ada data untuk ditampilkan.</div>
        )}
      </div>
    </div>
  );
}
