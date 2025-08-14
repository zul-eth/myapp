"use client";
import useSWR from "swr";
const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function CoinsPage() {
  const { data, error } = useSWR("/api/client/coins", fetcher);
  if (error) return <div>Error loading coins</div>;
  if (!data) return <div>Loading...</div>;
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Coins</h1>
      <ul className="space-y-2">
        {data.map((coin: any) => (
          <li key={coin.id} className="border p-2 rounded">
            {coin.logoUrl && <img src={coin.logoUrl} className="w-6 h-6 inline-block mr-2" />}
            {coin.name} ({coin.symbol})
          </li>
        ))}
      </ul>
    </div>
  );
}
