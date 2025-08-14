"use client";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function AdminCoinNetworks() {
  const { data, mutate } = useSWR("/api/admin/coin-networks", fetcher);
  const { data: coins } = useSWR("/api/admin/coins", fetcher);
  const { data: networks } = useSWR("/api/admin/networks", fetcher);

  const [form, setForm] = useState({ id: "", coinId: "", networkId: "" });
  const [isEditing, setIsEditing] = useState(false);

  const resetForm = () => {
    setForm({ id: "", coinId: "", networkId: "" });
    setIsEditing(false);
  };

  const handleSubmit = async () => {
    const method = isEditing ? "PUT" : "POST";
    const url = isEditing ? `/api/admin/coin-networks/${form.id}` : `/api/admin/coin-networks`;

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coinId: form.coinId, networkId: form.networkId }),
    });

    resetForm();
    mutate();
  };

  const handleEdit = (cn: any) => {
    setForm({ id: cn.id, coinId: cn.coin.id, networkId: cn.network.id });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/coin-networks/${id}`, { method: "DELETE" });
    mutate();
  };

  if (!data || !coins || !networks) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Manage Coin Network</h1>

      {/* Form */}
      <div className="mb-4 space-y-2 border p-4 rounded bg-white shadow">
        <select
          value={form.coinId}
          onChange={e => setForm({ ...form, coinId: e.target.value })}
          className="border p-1 w-full"
        >
          <option value="">Select Coin</option>
          {coins.map((coin: any) => (
            <option key={coin.id} value={coin.id}>
              {coin.symbol} — {coin.name}
            </option>
          ))}
        </select>

        <select
          value={form.networkId}
          onChange={e => setForm({ ...form, networkId: e.target.value })}
          className="border p-1 w-full"
        >
          <option value="">Select Network</option>
          {networks.map((net: any) => (
            <option key={net.id} value={net.id}>
              {net.name} ({net.symbol ?? "-"}) [{net.family}]
            </option>
          ))}
        </select>

        <div className="space-x-2">
          <button onClick={handleSubmit} className="bg-blue-500 text-white px-3 py-1 rounded">
            {isEditing ? "Update" : "Add"}
          </button>
          {isEditing && (
            <button onClick={resetForm} className="bg-gray-400 text-white px-3 py-1 rounded">
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <ul className="space-y-2">
        {data.map((cn: any) => (
          <li
            key={cn.id}
            className="border p-2 flex justify-between items-center bg-white shadow rounded"
          >
            <span>
              <b>{cn.coin.symbol}</b> ({cn.coin.name}) →
              <b>{cn.network.name}</b> ({cn.network.symbol ?? "-"}/{cn.network.family})
            </span>
            <div className="space-x-2">
              <button onClick={() => handleEdit(cn)} className="text-blue-500">Edit</button>
              <button onClick={() => handleDelete(cn.id)} className="text-red-500">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
