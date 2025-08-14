"use client";

import { useEffect, useState } from "react";
import {
  adminGetOrders,
  adminUpdateOrder,
  adminDeleteOrder
} from "@/lib/api/order";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    const data = await adminGetOrders({ status: statusFilter, search });
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter, search]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    await adminUpdateOrder(id, { status: newStatus });
    loadOrders();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Yakin hapus order ini?")) {
      await adminDeleteOrder(id);
      loadOrders();
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Manajemen Orders</h1>

      <div className="flex gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded p-2"
        >
          <option value="">Semua Status</option>
          {[
            "PENDING",
            "WAITING_PAYMENT",
            "UNDERPAID",
            "WAITING_CONFIRMATION",
            "CONFIRMED",
            "COMPLETED",
            "EXPIRED",
            "FAILED"
          ].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input
          placeholder="Cari ID / Coin"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded p-2 flex-1"
        />
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">ID</th>
              <th className="border p-2">Buy</th>
              <th className="border p-2">Pay</th>
              <th className="border p-2">Amount</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="border p-2">{o.id}</td>
                <td className="border p-2">
                  {o.coinToBuy.symbol} ({o.buyNetwork.name})
                </td>
                <td className="border p-2">
                  {o.payWith.symbol} ({o.payNetwork.name})
                </td>
                <td className="border p-2">{o.amount}</td>
                <td className="border p-2">
                  <select
                    value={o.status}
                    onChange={(e) => handleStatusChange(o.id, e.target.value)}
                    className="border rounded p-1"
                  >
                    {[
                      "PENDING",
                      "WAITING_PAYMENT",
                      "UNDERPAID",
                      "WAITING_CONFIRMATION",
                      "CONFIRMED",
                      "COMPLETED",
                      "EXPIRED",
                      "FAILED"
                    ].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="border p-2 space-x-2">
                  <button
                    onClick={() => handleDelete(o.id)}
                    className="bg-red-600 text-white px-2 py-1 rounded"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
