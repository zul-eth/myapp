"use client";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function AdminNetworks() {
  const { data, mutate } = useSWR("/api/admin/networks", fetcher);

  const [form, setForm] = useState({
    id: "",
    name: "",
    logoUrl: "",
    family: "EVM",
    chainId: "",
    symbol: "",
    rpcUrl: "",
    explorer: ""
  });
  const [isEditing, setIsEditing] = useState(false);

  const resetForm = () => {
    setForm({
      id: "",
      name: "",
      logoUrl: "",
      family: "EVM",
      chainId: "",
      symbol: "",
      rpcUrl: "",
      explorer: ""
    });
    setIsEditing(false);
  };

  const handleSubmit = async () => {
    if (isEditing) {
      await fetch(`/api/admin/networks/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          logoUrl: form.logoUrl,
          family: form.family,
          chainId: form.chainId,
          symbol: form.symbol,
          rpcUrl: form.rpcUrl,
          explorer: form.explorer
        }),
      });
    } else {
      await fetch("/api/admin/networks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          logoUrl: form.logoUrl,
          family: form.family,
          chainId: form.chainId,
          symbol: form.symbol,
          rpcUrl: form.rpcUrl,
          explorer: form.explorer
        }),
      });
    }
    resetForm();
    mutate();
  };

  const handleEdit = (network: any) => {
    setForm({
      id: network.id,
      name: network.name,
      logoUrl: network.logoUrl || "",
      family: network.family || "EVM",
      chainId: network.chainId || "",
      symbol: network.symbol || "",
      rpcUrl: network.rpcUrl || "",
      explorer: network.explorer || ""
    });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/networks/${id}`, { method: "DELETE" });
    mutate();
  };

  if (!data) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Manage Networks</h1>

      {/* Form */}
      <div className="mb-4 space-y-2 border p-4 rounded bg-white shadow">
        <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="border p-1 w-full" />
        <input placeholder="Logo URL" value={form.logoUrl} onChange={e => setForm({ ...form, logoUrl: e.target.value })} className="border p-1 w-full" />
        <input placeholder="Symbol" value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value })} className="border p-1 w-full" />
        <input placeholder="Chain ID" value={form.chainId} onChange={e => setForm({ ...form, chainId: e.target.value })} className="border p-1 w-full" />
        <select value={form.family} onChange={e => setForm({ ...form, family: e.target.value })} className="border p-1 w-full">
          <option value="EVM">EVM</option>
          <option value="TRON">TRON</option>
          <option value="SOLANA">SOLANA</option>
          <option value="XRP">XRP</option>
          <option value="DOGE">DOGE</option>
          <option value="LTC">LTC</option>
          <option value="TON">TON</option>
        </select>
        <input placeholder="RPC URL" value={form.rpcUrl} onChange={e => setForm({ ...form, rpcUrl: e.target.value })} className="border p-1 w-full" />
        <input placeholder="Explorer URL" value={form.explorer} onChange={e => setForm({ ...form, explorer: e.target.value })} className="border p-1 w-full" />
        
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
        {data.map((net: any) => (
          <li key={net.id} className="border p-2 flex justify-between items-center bg-white shadow rounded">
            <div className="flex items-center space-x-2">
              {net.logoUrl && <img src={net.logoUrl} alt={net.name} className="w-6 h-6" />}
              <span>{net.name} ({net.symbol || net.family})</span>
            </div>
            <div className="space-x-2">
              <button onClick={() => handleEdit(net)} className="text-blue-500">Edit</button>
              <button onClick={() => handleDelete(net.id)} className="text-red-500">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
