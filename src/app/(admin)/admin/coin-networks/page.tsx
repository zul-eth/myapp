"use client";

import { useEffect, useState } from "react";
import {
  getCoinNetworks,
  createCoinNetwork,
  updateCoinNetwork,
  deleteCoinNetwork,
  getAssetTypes,
  getMemoKinds
} from "@/lib/api/coinNetwork";

export default function AdminCoinNetworksPage() {
  const [coinNetworks, setCoinNetworks] = useState<any[]>([]);
  const [coins, setCoins] = useState<any[]>([]);
  const [networks, setNetworks] = useState<any[]>([]);
  const [assetTypes, setAssetTypes] = useState<string[]>([]);
  const [memoKinds, setMemoKinds] = useState<string[]>([]);

  const [editing, setEditing] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    coinId: "",
    networkId: "",
    assetType: "",
    contractAddress: "",
    decimals: 18,
    symbolOverride: "",
    memoKind: "",
    memoLabel: "",
    memoRegex: ""
  });

  const loadData = async () => {
    const [cnData, coinsData, netsData, assets, memos] = await Promise.all([
      getCoinNetworks(),
      fetch("/api/admin/coins").then(r => r.json()),
      fetch("/api/admin/networks").then(r => r.json()),
      getAssetTypes(),
      getMemoKinds()
    ]);

    setCoinNetworks(cnData);
    setCoins(coinsData);
    setNetworks(netsData);
    setAssetTypes(assets);
    setMemoKinds(memos);

    // Set default form values
    if (!editing) {
      setFormData({
        coinId: coinsData[0]?.id || "",
        networkId: netsData[0]?.id || "",
        assetType: assets[0] || "",
        contractAddress: "",
        decimals: 18,
        symbolOverride: "",
        memoKind: memos[0] || "",
        memoLabel: "",
        memoRegex: ""
      });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setEditing(null);
    setFormData({
      coinId: coins[0]?.id || "",
      networkId: networks[0]?.id || "",
      assetType: assetTypes[0] || "",
      contractAddress: "",
      decimals: 18,
      symbolOverride: "",
      memoKind: memoKinds[0] || "",
      memoLabel: "",
      memoRegex: ""
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await updateCoinNetwork(editing.id, formData);
    } else {
      await createCoinNetwork(formData);
    }
    resetForm();
    loadData();
  };

  const handleEdit = (item: any) => {
    setEditing(item);
    setFormData({
      coinId: item.coinId,
      networkId: item.networkId,
      assetType: item.assetType,
      contractAddress: item.contractAddress || "",
      decimals: item.decimals || 18,
      symbolOverride: item.symbolOverride || "",
      memoKind: item.memoKind,
      memoLabel: item.memoLabel || "",
      memoRegex: item.memoRegex || ""
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Hapus CoinNetwork ini?")) {
      await deleteCoinNetwork(id);
      loadData();
    }
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Manajemen CoinNetwork</h1>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded bg-gray-50">
        {/* Coin */}
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

        {/* Network */}
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

        {/* Asset Type */}
        <div>
          <label className="block font-medium">Asset Type</label>
          <select
            value={formData.assetType}
            onChange={(e) => setFormData({ ...formData, assetType: e.target.value })}
            className="border rounded p-2 w-full"
          >
            {assetTypes.map((at) => (
              <option key={at} value={at}>
                {at}
              </option>
            ))}
          </select>
        </div>

        {/* Contract Address */}
        <div>
          <label className="block font-medium">Contract Address</label>
          <input
            value={formData.contractAddress}
            onChange={(e) => setFormData({ ...formData, contractAddress: e.target.value })}
            className="border rounded p-2 w-full"
          />
        </div>

        {/* Decimals */}
        <div>
          <label className="block font-medium">Decimals</label>
          <input
            type="number"
            value={formData.decimals}
            onChange={(e) => setFormData({ ...formData, decimals: parseInt(e.target.value) })}
            className="border rounded p-2 w-full"
          />
        </div>

        {/* Symbol Override */}
        <div>
          <label className="block font-medium">Symbol Override</label>
          <input
            value={formData.symbolOverride}
            onChange={(e) => setFormData({ ...formData, symbolOverride: e.target.value })}
            className="border rounded p-2 w-full"
          />
        </div>

        {/* Memo Kind */}
        <div>
          <label className="block font-medium">Memo Kind</label>
          <select
            value={formData.memoKind}
            onChange={(e) => setFormData({ ...formData, memoKind: e.target.value })}
            className="border rounded p-2 w-full"
          >
            {memoKinds.map((mk) => (
              <option key={mk} value={mk}>
                {mk}
              </option>
            ))}
          </select>
        </div>

        {/* Memo Label */}
        <div>
          <label className="block font-medium">Memo Label</label>
          <input
            value={formData.memoLabel}
            onChange={(e) => setFormData({ ...formData, memoLabel: e.target.value })}
            className="border rounded p-2 w-full"
          />
        </div>

        {/* Memo Regex */}
        <div>
          <label className="block font-medium">Memo Regex</label>
          <input
            value={formData.memoRegex}
            onChange={(e) => setFormData({ ...formData, memoRegex: e.target.value })}
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
            <th className="border p-2">Coin</th>
            <th className="border p-2">Network</th>
            <th className="border p-2">Asset Type</th>
            <th className="border p-2">Decimals</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {coinNetworks.map((cn) => (
            <tr key={cn.id}>
              <td className="border p-2">{cn.coin.symbol}</td>
              <td className="border p-2">{cn.network.name}</td>
              <td className="border p-2">{cn.assetType}</td>
              <td className="border p-2">{cn.decimals}</td>
              <td className="border p-2">{cn.isActive ? "Aktif" : "Nonaktif"}</td>
              <td className="border p-2 space-x-2">
                <button
                  onClick={() => handleEdit(cn)}
                  className="bg-blue-500 text-white px-2 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(cn.id)}
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
