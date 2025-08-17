"use client";

import { useEffect, useState } from "react";
import { getNetworks } from "@/lib/api/network";

type Network = {
  id: string;
  symbol: string;
  name: string;
  family: string;
  isActive: boolean;
};

export default function NetworkSelect({
  value,
  onChange,
  includeInactive = false,
  valueKey = "id", // bisa "id" atau "symbol"
  className = "",
}: {
  value: string;
  onChange: (val: string) => void;
  includeInactive?: boolean;
  valueKey?: "id" | "symbol";
  className?: string;
}) {
  const [items, setItems] = useState<Network[]>([]);
  useEffect(() => {
    getNetworks().then((data) => {
      const list = Array.isArray(data) ? data : [];
      setItems(includeInactive ? list : list.filter((n) => n.isActive));
    });
  }, [includeInactive]);

  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={`border rounded p-2 w-full ${className}`}>
      <option value="">Pilih Network</option>
      {items.map((n) => {
        const v = valueKey === "symbol" ? n.symbol : n.id;
        return (
          <option key={n.id} value={v}>
            {n.symbol} — {n.name} ({n.family})
          </option>
        );
      })}
    </select>
  );
}
