"use client";
import useSWR from "swr";
const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function PaymentOptionsPage() {
  const { data, error } = useSWR("/api/client/payment-options", fetcher);
  if (error) return <div>Error loading payment options</div>;
  if (!data) return <div>Loading...</div>;
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Payment Options</h1>
      <ul className="space-y-2">
        {data.map((po: any) => (
          <li key={po.id} className="border p-2 rounded">
            Coin: {po.coinId} — Network: {po.networkId}
          </li>
        ))}
      </ul>
    </div>
  );
}
