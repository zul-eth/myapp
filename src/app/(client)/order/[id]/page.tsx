"use client";

import { useEffect, useState } from "react";
import { clientGetOrderDetail, clientGetOrderStatus } from "@/lib/api/order";

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<any>(null);
  const [status, setStatus] = useState("");

  const loadOrder = async () => {
    const data = await clientGetOrderDetail(params.id);
    setOrder(data);
    setStatus(data.status);
  };

  useEffect(() => {
    loadOrder();
    const interval = setInterval(async () => {
      const { status: newStatus } = await clientGetOrderStatus(params.id);
      setStatus(newStatus);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!order) return <p>Loading...</p>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Detail Order</h1>
      <p><b>Status:</b> {status}</p>
      <p><b>Amount:</b> {order.amount}</p>
      <p><b>Bayar dengan:</b> {order.payWith.symbol} di {order.payNetwork.name}</p>
      <p><b>Alamat Pembayaran:</b> {order.paymentAddr}</p>

      {status === "WAITING_PAYMENT" && (
        <div className="mt-4 p-4 border rounded bg-yellow-50">
          <p>Lakukan pembayaran ke alamat di atas, lalu tunggu konfirmasi.</p>
        </div>
      )}
    </div>
  );
}
