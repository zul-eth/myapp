"use client";

import { useEffect, useState } from "react";
import {
  getExchangeRates,
  createExchangeRate,
  updateExchangeRate,
  deleteExchangeRate
} from "@/lib/api/exchangeRate";

export default function AdminExchangeRatesPage() {
  const [exchangeRates, setExchangeRates] = useState<any[]>([]);
  const [coins, setCoins] = useState<any[]>([]);
  const [networks, setNetworks] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    buyCoinId: "",
    buyNetworkId: "",
    payCoinId: "",
    payNetworkId: "",
    rate: 0,
    updatedBy: ""
  });

  const loadData = async () => {
    const [erData, coinData, netData] = await Promise.all([
      getExchangeRates(),
      fetch("/api/admin/coins").then(r => r.json()),
      fetch("/api/admin/networks").then(r => r.json())
    ]);

    setExchangeRates(erData);
    setCoins(coinData);
    setNetworks(netData);

    if (!editing) {
      setFormData({
        buyCoinId: coinData[0]?.id || "",
        buyNetworkId: netData[0]?.id || "",
        payCoinId: coinData[1]?.id || "",
        payNetworkId: netData[1]?.id || "",
        rate: 0,
        updatedBy: ""
      });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setEditing(null);
    setFormData({
      buyCoinId: coins[0]?.id || "",
      buyNetworkId: networks[0]?.id || "",
      payCoinId: coins[1]?.id || "",
      payNetworkId: networks[1]?.id || "",
      rate: 0,
      updatedBy: ""
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await updateExchangeRate(editing.id, formData);
    } else {
      await createExchangeRate(formData);
    }
    resetForm();
    loadData();
  };

  const handleEdit = (item: any) => {
    setEditing(item);
    setFormData({
      buyCoinId: item.buyCoinId,
      buyNetworkId: item.buyNetworkId,
      payCoinId: item.payCoinId,
      payNetworkId: item.payNetworkId,
      rate: item.rate,
      updatedBy: item.updatedBy || ""
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Hapus ExchangeRate ini?")) {
      await deleteExchangeRate(id);
      loadData();
    }
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Manajemen ExchangeRate</h1>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded bg-gray-50">
        <div className="grid grid-cols-2 gap-4">
          {/* Buy Coin */}
          <div>
            <label className="block font-medium">Buy Coin</label>
            <select
              value={formData.buyCoinId}
              onChange={(e) => setFormData({ ...formData, buyCoinId: e.target.value })}
              className="border rounded p-2 w-full"
            >
              {coins.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.symbol} - {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Buy Network */}
          <div>
            <label className="block font-medium">Buy Network</label>
            <select
              value={formData.buyNetworkId}
              onChange={(e) => setFormData({ ...formData, buyNetworkId: e.target.value })}
              className="border rounded p-2 w-full"
            >
              {networks.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name} ({n.family})
                </option>
              ))}
            </select>
          </div>

          {/* Pay Coin */}
          <div>
            <label className="block font-medium">Pay Coin</label>
            <select
              value={formData.payCoinId}
              onChange={(e) => setFormData({ ...formData, payCoinId: e.target.value })}
              className="border rounded p-2 w-full"
            >
              {coins.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.symbol} - {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Pay Network */}
          <div>
            <label className="block font-medium">Pay Network</label>
            <select
              value={formData.payNetworkId}
              onChange={(e) => setFormData({ ...formData, payNetworkId: e.target.value })}
              className="border rounded p-2 w-full"
            >
              {networks.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name} ({n.family})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Rate */}
        <div>
          <label className="block font-medium">Rate</label>
          <input
            type="number"
            step="0.00000001"
            value={formData.rate}
            onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) })}
            className="border rounded p-2 w-full"
          />
        </div>

        {/* Updated By */}
        <div>
          <label className="block font-medium">Updated By</label>
          <input
            value={formData.updatedBy}
            onChange={(e) => setFormData({ ...formData, updatedBy: e.target.value })}
            className="border rounded p-2 w-full"
          />
        </div>

        <button className="bg-blue-600 text-white px-4 py-2 rounded">
          {editing ? "Update" : "Create"}
        </button>
        {editing && (
          <button
            type="button"
            onClick={resetForm}
            className="ml-2 bg-gray-400 text-white px-4 py-2 rounded"
          >
            Batal
          </button>
        )}
      </form>

      {/* Table */}
      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Buy Coin</th>
            <th className="border p-2">Buy Network</th>
            <th className="border p-2">Pay Coin</th>
            <th className="border p-2">Pay Network</th>
            <th className="border p-2">Rate</th>
            <th className="border p-2">Updated By</th>
            <th className="border p-2">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {exchangeRates.map((er) => (
            <tr key={er.id}>
              <td className="border p-2">{er.buyCoin.symbol}</td>
              <td className="border p-2">{er.buyNetwork.name}</td>
              <td className="border p-2">{er.payCoin.symbol}</td>
              <td className="border p-2">{er.payNetwork.name}</td>
              <td className="border p-2">{er.rate}</td>
              <td className="border p-2">{er.updatedBy || "-"}</td>
              <td className="border p-2 space-x-2">
                <button
                  onClick={() => handleEdit(er)}
                  className="bg-blue-500 text-white px-2 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(er.id)}
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
