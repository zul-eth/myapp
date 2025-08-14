"use client";
import useSWR from "swr";
const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function AdminOrders() {
  const { data } = useSWR("/api/admin/orders", fetcher);
  if (!data) return <div>Loading...</div>;
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Orders (Admin)</h1>
      <ul className="space-y-2">
        {data.map((order: any) => (
          <li key={order.id} className="border p-2 rounded">
            <div>ID: {order.id}</div>
            <div>Status: {order.status}</div>
            <div>Amount: {order.amount}</div>
            <div>Price Rate: {order.priceRate}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
