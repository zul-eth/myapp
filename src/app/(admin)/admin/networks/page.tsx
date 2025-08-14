"use client";

import { useState, useEffect } from "react";
import {
  getNetworks,
  createNetwork,
  updateNetwork,
  deleteNetwork,
  toggleNetworkActive
} from "@/lib/api/network";

export default function AdminNetworksPage() {
  const [networks, setNetworks] = useState<any[]>([]);
  const [families, setFamilies] = useState<string[]>([]);
  const [editingNetwork, setEditingNetwork] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    logoUrl: "",
    family: "",
    chainId: "",
    symbol: "",
    rpcUrl: "",
    explorer: ""
  });

  const loadNetworks = async () => {
    const data = await getNetworks();
    setNetworks(data);
  };

  const loadFamilies = async () => {
    const res = await fetch("/api/admin/networks/families");
    const data = await res.json();
    setFamilies(data);
    if (!formData.family && data.length > 0) {
      setFormData((prev) => ({ ...prev, family: data[0] }));
    }
  };

  useEffect(() => {
    loadNetworks();
    loadFamilies();
  }, []);

  const resetForm = () => {
    setEditingNetwork(null);
    setFormData({
      name: "",
      logoUrl: "",
      family: families.length > 0 ? families[0] : "",
      chainId: "",
      symbol: "",
      rpcUrl: "",
      explorer: ""
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingNetwork) {
      await updateNetwork(editingNetwork.id, formData);
    } else {
      await createNetwork(formData);
    }
    resetForm();
    loadNetworks();
  };

  const handleEdit = (network: any) => {
    setEditingNetwork(network);
    setFormData({
      name: network.name || "",
      logoUrl: network.logoUrl || "",
      family: network.family || families[0] || "",
      chainId: network.chainId || "",
      symbol: network.symbol || "",
      rpcUrl: network.rpcUrl || "",
      explorer: network.explorer || ""
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Hapus network ini? Jika masih digunakan, akan dinonaktifkan.")) {
      await deleteNetwork(id);
      loadNetworks();
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    await toggleNetworkActive(id, !current);
    loadNetworks();
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Manajemen Network</h1>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded bg-gray-50">
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

        <div>
          <label className="block font-medium">Family</label>
          <select
            value={formData.family}
            onChange={(e) => setFormData({ ...formData, family: e.target.value })}
            className="border rounded p-2 w-full"
          >
            {families.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium">Chain ID</label>
          <input
            value={formData.chainId}
            onChange={(e) => setFormData({ ...formData, chainId: e.target.value })}
            className="border rounded p-2 w-full"
          />
        </div>

        <div>
          <label className="block font-medium">Symbol</label>
          <input
            value={formData.symbol}
            onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
            className="border rounded p-2 w-full"
          />
        </div>

        <div>
          <label className="block font-medium">RPC URL</label>
          <input
            value={formData.rpcUrl}
            onChange={(e) => setFormData({ ...formData, rpcUrl: e.target.value })}
            className="border rounded p-2 w-full"
          />
        </div>

        <div>
          <label className="block font-medium">Explorer URL</label>
          <input
            value={formData.explorer}
            onChange={(e) => setFormData({ ...formData, explorer: e.target.value })}
            className="border rounded p-2 w-full"
          />
        </div>

        <button className="bg-blue-600 text-white px-4 py-2 rounded">
          {editingNetwork ? "Update" : "Create"}
        </button>
        {editingNetwork && (
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
            <th className="border p-2">Name</th>
            <th className="border p-2">Family</th>
            <th className="border p-2">Chain ID</th>
            <th className="border p-2">Symbol</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {networks.map((network) => (
            <tr key={network.id}>
              <td className="border p-2">{network.name}</td>
              <td className="border p-2">{network.family}</td>
              <td className="border p-2">{network.chainId}</td>
              <td className="border p-2">{network.symbol}</td>
              <td className="border p-2">
                {network.isActive ? "Aktif" : "Nonaktif"}
              </td>
              <td className="border p-2 space-x-2">
                <button
                  onClick={() => handleEdit(network)}
                  className="bg-blue-500 text-white px-2 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleToggle(network.id, network.isActive)}
                  className={`${network.isActive ? "bg-yellow-500" : "bg-green-500"} text-white px-2 py-1 rounded`}
                >
                  {network.isActive ? "Nonaktifkan" : "Aktifkan"}
                </button>
                <button
                  onClick={() => handleDelete(network.id)}
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
