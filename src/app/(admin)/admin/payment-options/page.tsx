"use client";
import { useState } from "react";
import useSWR from "swr";
const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function AdminPaymentOptions() {
  const { data, mutate } = useSWR("/api/admin/payment-options", fetcher);
  const [form, setForm] = useState({ id: "", coinId: "", networkId: "" });
  const [isEditing, setIsEditing] = useState(false);

  const resetForm = () => {
    setForm({ id: "", coinId: "", networkId: "" });
    setIsEditing(false);
  };

  const handleSubmit = async () => {
    if (isEditing) {
      await fetch(`/api/admin/payment-options/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coinId: form.coinId, networkId: form.networkId }),
      });
    } else {
      await fetch("/api/admin/payment-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coinId: form.coinId, networkId: form.networkId }),
      });
    }
    resetForm();
    mutate();
  };

  const handleEdit = (po: any) => {
    setForm({ id: po.id, coinId: po.coinId, networkId: po.networkId });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/payment-options/${id}`, { method: "DELETE" });
    mutate();
  };

  if (!data) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Manage Payment Options</h1>

      <div className="mb-4 space-y-2 border p-4 rounded bg-white shadow">
        <input placeholder="Coin ID" value={form.coinId} onChange={e => setForm({ ...form, coinId: e.target.value })} className="border p-1 w-full" />
        <input placeholder="Network ID" value={form.networkId} onChange={e => setForm({ ...form, networkId: e.target.value })} className="border p-1 w-full" />
        <div className="space-x-2">
          <button onClick={handleSubmit} className="bg-blue-500 text-white px-3 py-1 rounded">
            {isEditing ? "Update" : "Add"}
          </button>
          {isEditing && <button onClick={resetForm} className="bg-gray-400 text-white px-3 py-1 rounded">Cancel</button>}
        </div>
      </div>

      <ul className="space-y-2">
        {data.map((po: any) => (
          <li key={po.id} className="border p-2 flex justify-between items-center bg-white shadow rounded">
            <span>Coin: {po.coinId} - Network: {po.networkId}</span>
            <div className="space-x-2">
              <button onClick={() => handleEdit(po)} className="text-blue-500">Edit</button>
              <button onClick={() => handleDelete(po.id)} className="text-red-500">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
