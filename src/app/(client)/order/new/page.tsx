"use client";

import { useEffect, useState } from "react";
import { clientCreateOrder } from "@/lib/api/order";

export default function NewOrderPage() {
  const [coins, setCoins] = useState<any[]>([]);
  const [networks, setNetworks] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    coinToBuyId: "",
    buyNetworkId: "",
    payWithId: "",
    payNetworkId: "",
    amount: 0,
    priceRate: 0,
    receivingAddr: ""
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/coins").then(r => r.json()),
      fetch("/api/admin/networks").then(r => r.json())
    ]).then(([coinsData, netsData]) => {
      setCoins(coinsData);
      setNetworks(netsData);
      setFormData(prev => ({
        ...prev,
        coinToBuyId: coinsData[0]?.id || "",
        buyNetworkId: netsData[0]?.id || "",
        payWithId: coinsData[1]?.id || "",
        payNetworkId: netsData[1]?.id || ""
      }));
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const order = await clientCreateOrder(formData);
    window.location.href = `/order/${order.id}`;
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Buat Order Baru</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Coin to Buy */}
        <div>
          <label className="block mb-1">Coin to Buy</label>
          <select
            value={formData.coinToBuyId}
            onChange={(e) => setFormData({ ...formData, coinToBuyId: e.target.value })}
            className="border p-2 w-full"
          >
            {coins.map((c) => (
              <option key={c.id} value={c.id}>{c.symbol}</option>
            ))}
          </select>
        </div>

        {/* Buy Network */}
        <div>
          <label className="block mb-1">Buy Network</label>
          <select
            value={formData.buyNetworkId}
            onChange={(e) => setFormData({ ...formData, buyNetworkId: e.target.value })}
            className="border p-2 w-full"
          >
            {networks.map((n) => (
              <option key={n.id} value={n.id}>{n.name}</option>
            ))}
          </select>
        </div>

        {/* Pay With */}
        <div>
          <label className="block mb-1">Pay With</label>
          <select
            value={formData.payWithId}
            onChange={(e) => setFormData({ ...formData, payWithId: e.target.value })}
            className="border p-2 w-full"
          >
            {coins.map((c) => (
              <option key={c.id} value={c.id}>{c.symbol}</option>
            ))}
          </select>
        </div>

        {/* Pay Network */}
        <div>
          <label className="block mb-1">Pay Network</label>
          <select
            value={formData.payNetworkId}
            onChange={(e) => setFormData({ ...formData, payNetworkId: e.target.value })}
            className="border p-2 w-full"
          >
            {networks.map((n) => (
              <option key={n.id} value={n.id}>{n.name}</option>
            ))}
          </select>
        </div>

        {/* Amount */}
        <div>
          <label className="block mb-1">Amount</label>
          <input
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
            className="border p-2 w-full"
          />
        </div>

        {/* Receiving Address */}
        <div>
          <label className="block mb-1">Receiving Address</label>
          <input
            value={formData.receivingAddr}
            onChange={(e) => setFormData({ ...formData, receivingAddr: e.target.value })}
            className="border p-2 w-full"
          />
        </div>

        <button className="bg-blue-600 text-white px-4 py-2 rounded">
          Buat Order
        </button>
      </form>
    </div>
  );
}
