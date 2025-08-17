"use client";

import { useEffect, useState } from "react";
import { getPublicNetworks } from "@/lib/api/network";

type Network = {
  id: string;
  symbol: string | null;
  name: string;
  family: string;
  isActive?: boolean;
};

export default function PublicNetworkSelect({
  value,
  onChange,
  family,            // opsional: batasi keluarga chain (EVM, TRON, dst.)
  valueKey = "symbol", // default symbol agar payload ramah
  className = "",
}: {
  value: string;
  onChange: (val: string) => void;
  family?: string;
  valueKey?: "id" | "symbol";
  className?: string;
}) {
  const [items, setItems] = useState<Network[]>([]);

  useEffect(() => {
    getPublicNetworks({ family }).then((d) => {
      const rows = Array.isArray(d) ? d : [];
      // defensif: filter aktif + urut (symbol/null → fallback name)
      const active = rows.filter((n) => n.isActive !== false);
      active.sort((a, b) => {
        const as = (a.symbol ?? a.name);
        const bs = (b.symbol ?? b.name);
        return as.localeCompare(bs);
      });
      setItems(active);
    });
  }, [family]);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`border rounded p-2 w-full ${className}`}
    >
      <option value="">Pilih Network</option>
      {items.map((n) => {
        const v = valueKey === "id" ? n.id : (n.symbol ?? n.name);
        return (
          <option key={n.id} value={v}>
            {n.symbol ?? n.name} — {n.name} ({n.family})
          </option>
        );
      })}
    </select>
  );
}
