"use client";

import { useEffect, useState } from "react";
import { getCoins } from "@/lib/api/coin";

type Coin = {
  id: string;
  symbol: string;
  name: string;
  logoUrl?: string | null;
  isActive: boolean;
};

export default function CoinSelect({
  value,
  onChange,
  includeInactive = false,
  valueKey = "symbol", // "symbol" (default) atau "id"
  className = "",
}: {
  value: string;
  onChange: (val: string) => void;
  includeInactive?: boolean;
  valueKey?: "symbol" | "id";
  className?: string;
}) {
  const [coins, setCoins] = useState<Coin[]>([]);

  useEffect(() => {
    getCoins().then((data) => {
      const list = Array.isArray(data) ? data : [];
      setCoins(includeInactive ? list : list.filter((c) => c.isActive));
    });
  }, [includeInactive]);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`border rounded p-2 w-full ${className}`}
    >
      <option value="">Pilih Coin</option>
      {coins.map((c) => {
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
