"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getExchangeRates,
  createExchangeRate,
  updateExchangeRate,
  deleteExchangeRate
} from "@/lib/api/exchangeRate";

// Ambil daftar coin & network dari endpoint admin yang sudah ada di proyekmu:
//   /api/admin/coins       -> name, symbol
//   /api/admin/networks    -> name, family
async function fetchCoins() {
  const res = await fetch("/api/admin/coins", { cache: "no-store" });
  return res.json();
}
async function fetchNetworks() {
  const res = await fetch("/api/admin/networks", { cache: "no-store" });
  return res.json();
}

const nf = (n: number | string) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 8 }).format(Number(n || 0));

export default function AdminExchangeRatesPage() {
  const [exchangeRates, setExchangeRates] = useState<any[]>([]);
  const [coins, setCoins] = useState<any[]>([]);
  const [networks, setNetworks] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({
    buyCoinId: "",
    buyNetworkId: "",
    payCoinId: "",
    payNetworkId: "",
    rate: "",
    updatedBy: "",
  });
  const [error, setError] = useState<string>("");

  const coinById = useMemo(
    () => Object.fromEntries(coins.map((c: any) => [c.id, c])),
    [coins]
  );
  const netById = useMemo(
    () => Object.fromEntries(networks.map((n: any) => [n.id, n])),
    [networks]
  );

  async function reload() {
    const [list, c, n] = await Promise.all([getExchangeRates(), fetchCoins(), fetchNetworks()]);
    setExchangeRates(list);
    setCoins(c);
    setNetworks(n);
  }

  useEffect(() => { reload().catch(console.error); }, []);

  function resetForm() {
    setEditing(null);
    setForm({
      buyCoinId: "",
      buyNetworkId: "",
      payCoinId: "",
      payNetworkId: "",
      rate: "",
      updatedBy: "",
    });
    setError("");
  }

  function setF<K extends keyof typeof form>(k: K, v: string) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  function validate() {
    if (!form.buyCoinId || !form.buyNetworkId || !form.payCoinId || !form.payNetworkId) {
      setError("Lengkapi semua kolom Buy/Pay (coin & network).");
      return false;
    }
    if (!form.rate || Number(form.rate) <= 0) {
      setError("Rate harus > 0.");
      return false;
    }
    setError("");
    return true;
  }

  async function handleCreate() {
    if (!validate()) return;
    await createExchangeRate({
      buyCoinId: form.buyCoinId,
      buyNetworkId: form.buyNetworkId,
      payCoinId: form.payCoinId,
      payNetworkId: form.payNetworkId,
      rate: Number(form.rate),
      updatedBy: form.updatedBy || null,
    });
    await reload();
    resetForm();
  }

  async function handleUpdate() {
    if (!editing) return;
    if (!validate()) return;
    await updateExchangeRate(editing.id, {
      buyCoinId: form.buyCoinId,
      buyNetworkId: form.buyNetworkId,
      payCoinId: form.payCoinId,
      payNetworkId: form.payNetworkId,
      rate: Number(form.rate),
      updatedBy: form.updatedBy || null,
    });
    await reload();
    resetForm();
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus rate ini?")) return;
    await deleteExchangeRate(id);
    await reload();
  }

  function startEdit(er: any) {
    setEditing(er);
    setForm({
      buyCoinId: er.buyCoinId,
      buyNetworkId: er.buyNetworkId,
      payCoinId: er.payCoinId,
      payNetworkId: er.payNetworkId,
      rate: String(er.rate),
      updatedBy: er.updatedBy || "",
    });
  }

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      <h1 className="mb-6 text-3xl font-bold">Manajemen ExchangeRate</h1>

      {/* FORM */}
      <div className="rounded border p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Buy Coin</label>
            <select
              className="w-full rounded border p-2"
              value={form.buyCoinId}
              onChange={(e) => setF("buyCoinId", e.target.value)}
            >
              <option value="">-- pilih --</option>
              {coins.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.symbol} — {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Buy Network</label>
            <select
              className="w-full rounded border p-2"
              value={form.buyNetworkId}
              onChange={(e) => setF("buyNetworkId", e.target.value)}
            >
              <option value="">-- pilih --</option>
              {networks.map((n: any) => (
                <option key={n.id} value={n.id}>
                  {n.name} ({n.family})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Pay Coin</label>
            <select
              className="w-full rounded border p-2"
              value={form.payCoinId}
              onChange={(e) => setF("payCoinId", e.target.value)}
            >
              <option value="">-- pilih --</option>
              {coins.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.symbol} — {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Pay Network</label>
            <select
              className="w-full rounded border p-2"
              value={form.payNetworkId}
              onChange={(e) => setF("payNetworkId", e.target.value)}
            >
              <option value="">-- pilih --</option>
              {networks.map((n: any) => (
                <option key={n.id} value={n.id}>
                  {n.name} ({n.family})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Rate</label>
            <input
              className="w-full rounded border p-2"
              inputMode="decimal"
              type="number"
              step="any"
              value={form.rate}
              onChange={(e) => setF("rate", e.target.value)}
              placeholder="contoh: 1 atau 0.98"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Updated By</label>
            <input
              className="w-full rounded border p-2"
              value={form.updatedBy}
              onChange={(e) => setF("updatedBy", e.target.value)}
              placeholder="nama admin (opsional)"
            />
          </div>
        </div>

        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

        <div className="mt-4 flex gap-3">
          {editing ? (
            <>
              <button onClick={handleUpdate} className="rounded bg-blue-600 px-4 py-2 text-white">
                Simpan Perubahan
              </button>
              <button onClick={resetForm} className="rounded border px-4 py-2">
                Batal
              </button>
            </>
          ) : (
            <button onClick={handleCreate} className="rounded bg-green-600 px-4 py-2 text-white">
              Create
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="mt-6 overflow-x-auto rounded border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Buy</th>
              <th className="p-2 text-left">Buy Network</th>
              <th className="p-2 text-left">Pay</th>
              <th className="p-2 text-left">Pay Network</th>
              <th className="p-2 text-left">Rate</th>
              <th className="p-2 text-left">Updated By</th>
              <th className="p-2 text-left">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {exchangeRates.map((er: any) => (
              <tr key={er.id} className="border-t">
                <td className="p-2">
                  <div className="font-medium">{coinById[er.buyCoinId]?.symbol || "-"}</div>
                  <div className="text-xs text-gray-500">{coinById[er.buyCoinId]?.name || "-"}</div>
                </td>
                <td className="p-2">
                  <div className="font-medium">{netById[er.buyNetworkId]?.name || "-"}</div>
                  <div className="text-xs text-gray-500">{netById[er.buyNetworkId]?.family || "-"}</div>
                </td>
                <td className="p-2">
                  <div className="font-medium">{coinById[er.payCoinId]?.symbol || "-"}</div>
                  <div className="text-xs text-gray-500">{coinById[er.payCoinId]?.name || "-"}</div>
                </td>
                <td className="p-2">
                  <div className="font-medium">{netById[er.payNetworkId]?.name || "-"}</div>
                  <div className="text-xs text-gray-500">{netById[er.payNetworkId]?.family || "-"}</div>
                </td>
                <td className="p-2">{nf(er.rate)}</td>
                <td className="p-2">{er.updatedBy || "-"}</td>
                <td className="p-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(er)}
                      className="rounded border px-3 py-1"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(er.id)}
                      className="rounded bg-red-600 px-3 py-1 text-white"
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {exchangeRates.length === 0 && (
              <tr>
                <td className="p-4 text-center text-gray-500" colSpan={7}>
                  Belum ada rate. Tambahkan di form di atas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
