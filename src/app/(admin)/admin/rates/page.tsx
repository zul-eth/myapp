"use client";
import { useState } from "react";
import useSWR from "swr";
const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function AdminRates() {
  const { data, mutate } = useSWR("/api/admin/rates", fetcher);
  const [form, setForm] = useState({ id: "", buyCoinId: "", buyNetworkId: "", payCoinId: "", payNetworkId: "", rate: "" });
  const [isEditing, setIsEditing] = useState(false);

  const resetForm = () => {
    setForm({ id: "", buyCoinId: "", buyNetworkId: "", payCoinId: "", payNetworkId: "", rate: "" });
    setIsEditing(false);
  };

  const handleSubmit = async () => {
    const payload = { ...form, rate: parseFloat(form.rate) };
    if (isEditing) {
      await fetch(`/api/admin/rates/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/admin/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    resetForm();
    mutate();
  };

  const handleEdit = (rate: any) => {
    setForm({
      id: rate.id,
      buyCoinId: rate.buyCoinId,
      buyNetworkId: rate.buyNetworkId,
      payCoinId: rate.payCoinId,
      payNetworkId: rate.payNetworkId,
      rate: rate.rate.toString()
    });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/rates/${id}`, { method: "DELETE" });
    mutate();
  };

  if (!data) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Manage Rates</h1>

      <div className="mb-4 space-y-2 border p-4 rounded bg-white shadow">
        {Object.keys(form).filter(k => k !== "id").map(k => (
          <input key={k} placeholder={k} value={(form as any)[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} className="border p-1 w-full" />
        ))}
        <div className="space-x-2">
          <button onClick={handleSubmit} className="bg-blue-500 text-white px-3 py-1 rounded">
            {isEditing ? "Update" : "Add"}
          </button>
          {isEditing && <button onClick={resetForm} className="bg-gray-400 text-white px-3 py-1 rounded">Cancel</button>}
        </div>
      </div>

      <ul className="space-y-2">
        {data.map((rate: any) => (
          <li key={rate.id} className="border p-2 flex justify-between items-center bg-white shadow rounded">
            <span>{rate.buyCoinId} → {rate.payCoinId} @ {rate.rate}</span>
            <div className="space-x-2">
              <button onClick={() => handleEdit(rate)} className="text-blue-500">Edit</button>
              <button onClick={() => handleDelete(rate.id)} className="text-red-500">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
