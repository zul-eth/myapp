"use client";
import { useEffect, useState } from "react";
import { clientCreateOrder } from "@/lib/api/order";

export default function NewOrderPage() {
  const [pairs, setPairs] = useState<any[]>([]);
  const [selectedPairId, setSelectedPairId] = useState("");
  const [formData, setFormData] = useState({
    amount: "",
    receivingAddr: "",
    receivingMemo: ""
  });

  useEffect(() => {
    fetch("/api/public/pairs")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setPairs(data);
          setSelectedPairId(data[0].id);
        }
      });
  }, []);

  const selectedPair = pairs.find(p => p.id === selectedPairId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPairId) return;

    const payload = {
      pairId: selectedPairId,
      amount: Number(formData.amount),
      receivingAddr: formData.receivingAddr,
      receivingMemo: formData.receivingMemo
    };

    const order = await clientCreateOrder(payload);
    window.location.href = `/order/${order.id}`;
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Buat Order Baru</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Pilih Pair */}
        <div>
          <label>Pilih Pair</label>
          <select
            value={selectedPairId}
            onChange={e => setSelectedPairId(e.target.value)}
            className="border p-2 w-full"
          >
            {pairs.map(p => (
              <option key={p.id} value={p.id}>
                {p.buyCoinSymbol} ({p.buyNetworkName}) → {p.payCoinSymbol} ({p.payNetworkName})
              </option>
            ))}
          </select>
        </div>

        {/* Rate */}
        {selectedPair && (
          <div>
            <label>Price Rate</label>
            <input type="number" value={selectedPair.rate} readOnly className="border p-2 w-full bg-gray-100" />
          </div>
        )}

        {/* Amount */}
        <div>
          <label>Amount</label>
          <input
            type="number"
            value={formData.amount}
            onChange={e => setFormData({ ...formData, amount: e.target.value })}
            className="border p-2 w-full"
            required
          />
        </div>

        {/* Receiving Address */}
        <div>
          <label>Receiving Address</label>
          <input
            value={formData.receivingAddr}
            onChange={e => setFormData({ ...formData, receivingAddr: e.target.value })}
            className="border p-2 w-full"
            required
          />
        </div>

        {/* Receiving Memo */}
        <div>
          <label>Receiving Memo (optional)</label>
          <input
            value={formData.receivingMemo}
            onChange={e => setFormData({ ...formData, receivingMemo: e.target.value })}
            className="border p-2 w-full"
          />
        </div>

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Buat Order
        </button>
      </form>
    </div>
  );
}
