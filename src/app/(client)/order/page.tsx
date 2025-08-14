"use client";
import { useState, useEffect } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function OrdersPage() {
  const { data: coins } = useSWR("/api/client/coins", fetcher);
  const { data: networks } = useSWR("/api/client/networks", fetcher);
  const { data: orders, mutate } = useSWR("/api/client/orders", fetcher);

  const [form, setForm] = useState({
    coinToBuyId: "",
    buyNetworkId: "",
    payWithId: "",
    payNetworkId: "",
    amount: "",
    receivingAddr: "",
    priceRate: 0,
    paymentAddr: "",
  });

  // Ambil rate setiap kali pair berubah
  useEffect(() => {
    const { coinToBuyId, buyNetworkId, payWithId, payNetworkId } = form;
    if (coinToBuyId && buyNetworkId && payWithId && payNetworkId) {
      const q = new URLSearchParams({
        buyCoinId: coinToBuyId,
        buyNetworkId,
        payCoinId: payWithId,
        payNetworkId,
      }).toString();
      fetch(`/api/client/rates/latest?${q}`)
        .then(res => res.json())
        .then(data => {
          if (data?.rate) {
            setForm(f => ({ ...f, priceRate: data.rate }));
          }
        });
    }
  }, [form.coinToBuyId, form.buyNetworkId, form.payWithId, form.payNetworkId]);

  // Ambil alamat pembayaran unik saat pay coin & network dipilih
  useEffect(() => {
    const { payWithId, payNetworkId } = form;
    if (payWithId && payNetworkId) {
      const q = new URLSearchParams({
        coinId: payWithId,
        networkId: payNetworkId,
      }).toString();
      fetch(`/api/client/wallets/payment-address?${q}`)
        .then(res => res.json())
        .then(data => {
          if (data?.address) {
            setForm(f => ({ ...f, paymentAddr: data.address }));
          }
        });
    }
  }, [form.payWithId, form.payNetworkId]);

  const createOrder = async () => {
    const payload = {
      coinToBuyId: form.coinToBuyId,
      buyNetworkId: form.buyNetworkId,
      payWithId: form.payWithId,
      payNetworkId: form.payNetworkId,
      amount: parseFloat(form.amount),
      receivingAddr: form.receivingAddr,
      priceRate: form.priceRate,
      paymentAddr: form.paymentAddr, // dikirim ke backend
    };

    await fetch("/api/client/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setForm({
      coinToBuyId: "",
      buyNetworkId: "",
      payWithId: "",
      payNetworkId: "",
      amount: "",
      receivingAddr: "",
      priceRate: 0,
      paymentAddr: "",
    });

    mutate();
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">My Orders</h1>

      {/* Form create order */}
      <div className="border p-4 rounded space-y-2">
        <h2 className="font-semibold">Create New Order</h2>

        <select value={form.coinToBuyId} onChange={e => setForm({ ...form, coinToBuyId: e.target.value })} className="border p-1 w-full">
          <option value="">Select Buy Coin</option>
          {coins?.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name} ({c.symbol})</option>
          ))}
        </select>

        <select value={form.buyNetworkId} onChange={e => setForm({ ...form, buyNetworkId: e.target.value })} className="border p-1 w-full">
          <option value="">Select Buy Network</option>
          {networks?.map((n: any) => (
            <option key={n.id} value={n.id}>{n.name} ({n.symbol || n.family})</option>
          ))}
        </select>

        <select value={form.payWithId} onChange={e => setForm({ ...form, payWithId: e.target.value })} className="border p-1 w-full">
          <option value="">Select Pay Coin</option>
          {coins?.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name} ({c.symbol})</option>
          ))}
        </select>

        <select value={form.payNetworkId} onChange={e => setForm({ ...form, payNetworkId: e.target.value })} className="border p-1 w-full">
          <option value="">Select Pay Network</option>
          {networks?.map((n: any) => (
            <option key={n.id} value={n.id}>{n.name} ({n.symbol || n.family})</option>
          ))}
        </select>

        <input type="number" placeholder="Amount" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="border p-1 w-full" />

        <input placeholder="Receiving Address" value={form.receivingAddr} onChange={e => setForm({ ...form, receivingAddr: e.target.value })} className="border p-1 w-full" />

        {/* Tampilkan alamat pembayaran */}
        {form.paymentAddr && (
          <div className="bg-gray-100 p-2 rounded">
            <strong>Payment Address:</strong> {form.paymentAddr}
          </div>
        )}

        <div className="text-sm text-gray-600">
          Price Rate: {form.priceRate || "-"}  
          {form.amount && form.priceRate ? (
            <span className="ml-2">Total Pay: {parseFloat(form.amount) * form.priceRate}</span>
          ) : null}
        </div>

        <button onClick={createOrder} className="bg-green-600 text-white px-3 py-1 rounded">Submit Order</button>
      </div>

      {/* List orders */}
      <div>
        <h2 className="font-semibold mb-2">Order History</h2>
        <ul className="space-y-2">
          {orders?.map((order: any) => (
            <li key={order.id} className="border p-2 rounded">
              <div>ID: {order.id}</div>
              <div>Status: {order.status}</div>
              <div>Amount: {order.amount}</div>
              <div>Price Rate: {order.priceRate}</div>
              <div>Payment Address: {order.paymentAddr}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
