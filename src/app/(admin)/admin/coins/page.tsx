"use client";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function AdminCoins() {
  const { data, mutate } = useSWR("/api/admin/coins", fetcher);
  const [form, setForm] = useState({ symbol: "", name: "", logoUrl: "" });
  const [editId, setEditId] = useState<string | null>(null);

  const resetForm = () => {
    setForm({ symbol: "", name: "", logoUrl: "" });
    setEditId(null);
  };

  const handleSubmit = async () => {
    if (!form.symbol || !form.name) return;

    if (editId) {
      await fetch(`/api/admin/coins/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/admin/coins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    resetForm();
    await mutate();
  };

  const handleEdit = (coin: any) => {
    setForm({ symbol: coin.symbol, name: coin.name, logoUrl: coin.logoUrl || "" });
    setEditId(coin.id);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/coins/${id}`, { method: "DELETE" });
    await mutate();
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await fetch(`/api/admin/coins/${id}/active`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    await mutate();
  };

  if (!data) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Manage Coins</h1>

      {/* Form */}
      <div className="mb-4 space-y-2 border p-4 rounded bg-white shadow">
        <input
          placeholder="Symbol"
          value={form.symbol}
          onChange={e => setForm({ ...form, symbol: e.target.value })}
          className="border p-1 w-full"
        />
        <input
          placeholder="Name"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          className="border p-1 w-full"
        />
        <input
          placeholder="Logo URL"
          value={form.logoUrl}
          onChange={e => setForm({ ...form, logoUrl: e.target.value })}
          className="border p-1 w-full"
        />
        <div className="space-x-2">
          <button onClick={handleSubmit} className="bg-blue-500 text-white px-3 py-1 rounded">
            {editId ? "Update" : "Add"}
          </button>
          {editId && (
            <button onClick={resetForm} className="bg-gray-400 text-white px-3 py-1 rounded">
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <ul className="space-y-2">
        {data.map((coin: any) => (
          <li key={coin.id} className="border p-2 flex justify-between items-center bg-white shadow rounded">
            <span>
              <b>{coin.symbol}</b> — {coin.name} [{coin.isActive ? "Active" : "Inactive"}]
            </span>
            <div className="space-x-2">
              <button onClick={() => handleEdit(coin)} className="text-blue-500">Edit</button>
              <button onClick={() => handleDelete(coin.id)} className="text-red-500">Delete</button>
              <button
                onClick={() => toggleActive(coin.id, coin.isActive)}
                className={coin.isActive ? "bg-red-500 text-white px-2" : "bg-green-500 text-white px-2"}
              >
                {coin.isActive ? "Deactivate" : "Activate"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
