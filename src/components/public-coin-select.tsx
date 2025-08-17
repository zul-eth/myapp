"use client";

import { useEffect, useState } from "react";

type Coin = { id: string; symbol: string; name: string; isActive?: boolean };

async function getPublicCoins(): Promise<Coin[]> {
  const res = await fetch("/api/public/coins", { next: { revalidate: 60 } });
  const t = await res.text();
  return t ? JSON.parse(t) : [];
}

export default function PublicCoinSelect({
  value,
  onChange,
  valueKey = "symbol", // default pakai SYMBOL agar payload ramah
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  valueKey?: "symbol" | "id";
  className?: string;
}) {
  const [items, setItems] = useState<Coin[]>([]);

  useEffect(() => {
    getPublicCoins().then((d) => {
      const rows = Array.isArray(d) ? d : [];
      // defensif: filter hanya aktif + urut symbol
      const active = rows.filter((c) => c.isActive !== false);
      active.sort((a, b) => a.symbol.localeCompare(b.symbol));
      setItems(active);
    });
  }, []);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`border rounded p-2 w-full ${className}`}
    >
      <option value="">Pilih Coin</option>
      {items.map((c) => {
        const v = valueKey === "id" ? c.id : c.symbol;
        return (
          <option key={c.id} value={v}>
            {c.symbol} — {c.name}
          </option>
        );
      })}
    </select>
  );
}
