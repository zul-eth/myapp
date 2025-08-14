"use client";
import useSWR from "swr";
const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function CoinNetworksPage() {
  const { data, error } = useSWR("/api/client/coin-networks", fetcher);
  if (error) return <div>Error loading coin-networks</div>;
  if (!data) return <div>Loading...</div>;
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Coin Networks</h1>
      <ul className="space-y-2">
        {data.map((cn: any) => (
          <li key={cn.id} className="border p-2 rounded">
            Coin: {cn.coinId} — Network: {cn.networkId}
          </li>
        ))}
      </ul>
    </div>
  );
}
