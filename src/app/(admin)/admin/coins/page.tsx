"use client";

import { useState, useEffect } from "react";
import {
  getCoins,
  createCoin,
  updateCoin,
  deleteCoin,
  toggleCoinActive
} from "@/lib/api/coin";

export default function AdminCoinsPage() {
  const [coins, setCoins] = useState<any[]>([]);
  const [editingCoin, setEditingCoin] = useState<any | null>(null);
  const [formData, setFormData] = useState({ symbol: "", name: "", logoUrl: "" });

  const loadCoins = async () => {
    const data = await getCoins();
    setCoins(data);
  };

  useEffect(() => {
    loadCoins();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      symbol: formData.symbol.trim().toUpperCase(),
      name: formData.name.trim(),
      logoUrl: formData.logoUrl.trim() || null
    };
    if (editingCoin && editingCoin.id) {
      await updateCoin(editingCoin.id, payload);
    } else {
      await createCoin(payload);
    }
    setEditingCoin(null);
    setFormData({ symbol: "", name: "", logoUrl: "" });
    await loadCoins(); // ✅ refresh
  };

  const handleEdit = (coin: any) => {
    setEditingCoin(coin);
    setFormData({
      symbol: coin.symbol,
      name: coin.name,
      logoUrl: coin.logoUrl || ""
    });
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (confirm("Hapus coin ini?")) {
      await deleteCoin(id);
      await loadCoins(); // ✅ refresh
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    await toggleCoinActive(id, !current);
    await loadCoins(); // ✅ refresh
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Manajemen Coin</h1>

      <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded bg-gray-50">
        <div>
          <label className="block font-medium">Symbol</label>
          <input
            value={formData.symbol}
            onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
            required
            className="border rounded p-2 w-full"
          />
        </div>
        <div>
          <label className="block font-medium">Name</label>
          <input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="border rounded p-2 w-full"
          />
        </div>
        <div>
          <label className="block font-medium">Logo URL</label>
          <input
            value={formData.logoUrl}
            onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
            className="border rounded p-2 w-full"
          />
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded">
          {editingCoin ? "Update" : "Create"}
        </button>
      </form>

      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Symbol</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {coins.map((coin) => (
            <tr key={coin.id}>
              <td className="border p-2">{coin.symbol}</td>
              <td className="border p-2">{coin.name}</td>
              <td className="border p-2">{coin.isActive ? "Aktif" : "Nonaktif"}</td>
              <td className="border p-2 space-x-2">
                <button onClick={() => handleEdit(coin)} className="bg-blue-500 text-white px-2 py-1 rounded">Edit</button>
                <button onClick={() => handleToggle(coin.id, coin.isActive)} className={`${coin.isActive ? "bg-yellow-500" : "bg-green-500"} text-white px-2 py-1 rounded`}>
                  {coin.isActive ? "Nonaktifkan" : "Aktifkan"}
                </button>
                <button onClick={() => handleDelete(coin.id)} className="bg-red-600 text-white px-2 py-1 rounded">Hapus</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
