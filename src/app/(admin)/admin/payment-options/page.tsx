"use client";

import { useEffect, useState } from "react";
import {
  getPaymentOptions,
  createPaymentOption,
  togglePaymentOptionActive,
  deletePaymentOption
} from "@/lib/api/paymentOption";

export default function AdminPaymentOptionsPage() {
  const [paymentOptions, setPaymentOptions] = useState<any[]>([]);
  const [coins, setCoins] = useState<any[]>([]);
  const [networks, setNetworks] = useState<any[]>([]);
  const [formData, setFormData] = useState({ coinId: "", networkId: "" });

  const loadData = async () => {
    const [poData, coinData, netData] = await Promise.all([
      getPaymentOptions(),
      fetch("/api/admin/coins").then(r => r.json()),
      fetch("/api/admin/networks").then(r => r.json())
    ]);

    setPaymentOptions(poData);
    setCoins(coinData);
    setNetworks(netData);

    if (!formData.coinId && coinData.length > 0) {
      setFormData((prev) => ({ ...prev, coinId: coinData[0].id }));
    }
    if (!formData.networkId && netData.length > 0) {
      setFormData((prev) => ({ ...prev, networkId: netData[0].id }));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createPaymentOption(formData);
    loadData();
  };

  const handleToggle = async (id: string, current: boolean) => {
    await togglePaymentOptionActive(id, !current);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Hapus PaymentOption ini?")) {
      await deletePaymentOption(id);
      loadData();
    }
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Manajemen PaymentOption</h1>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded bg-gray-50">
        <div>
          <label className="block font-medium">Coin</label>
          <select
            value={formData.coinId}
            onChange={(e) => setFormData({ ...formData, coinId: e.target.value })}
            className="border rounded p-2 w-full"
          >
            {coins.map((c) => (
              <option key={c.id} value={c.id}>
                {c.symbol} - {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium">Network</label>
          <select
            value={formData.networkId}
            onChange={(e) => setFormData({ ...formData, networkId: e.target.value })}
            className="border rounded p-2 w-full"
          >
            {networks.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name} ({n.family})
              </option>
            ))}
          </select>
        </div>

        <button className="bg-blue-600 text-white px-4 py-2 rounded">
          Tambah
        </button>
      </form>

      {/* Table */}
      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Coin</th>
            <th className="border p-2">Network</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {paymentOptions.map((po) => (
            <tr key={po.id}>
              <td className="border p-2">{po.coin.symbol}</td>
              <td className="border p-2">{po.network.name}</td>
              <td className="border p-2">{po.isActive ? "Aktif" : "Nonaktif"}</td>
              <td className="border p-2 space-x-2">
                <button
                  onClick={() => handleToggle(po.id, po.isActive)}
                  className={`${po.isActive ? "bg-yellow-500" : "bg-green-500"} text-white px-2 py-1 rounded`}
                >
                  {po.isActive ? "Nonaktifkan" : "Aktifkan"}
                </button>
                <button
                  onClick={() => handleDelete(po.id)}
                  className="bg-red-600 text-white px-2 py-1 rounded"
                >
                  Hapus
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
