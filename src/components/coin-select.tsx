"use client";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function CoinSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { data } = useSWR("/api/coins", fetcher);
  if (!data) return <option>Loading...</option>;

  return (
    <select value={value} onChange={e => onChange(e.target.value)} className="border p-1 w-full">
      <option value="">Select Coin</option>
      {data.map((coin: any) => (
        <option key={coin.id} value={coin.id}>
          {coin.symbol} — {coin.name}
        </option>
      ))}
    </select>
  );
}
