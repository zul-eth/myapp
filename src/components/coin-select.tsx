"use client";

import { useEffect, useState } from "react";

export default function CoinSelect({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const [coins, setCoins] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/client/coins")
      .then((res) => res.json())
      .then((data) => setCoins(data));
  }, []);

  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="border rounded p-2 w-full">
      <option value="">Pilih Coin</option>
      {coins.map((coin) => (
        <option key={coin.id} value={coin.symbol}>
          {coin.symbol} - {coin.name}
        </option>
      ))}
    </select>
  );
}
