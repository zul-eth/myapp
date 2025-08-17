"use client";

import { useEffect, useState } from "react";
import { getPublicPaymentOptions, PublicPaymentOptionParams } from "@/lib/api/paymentOption";

type Row = {
  id: string;
  isActive: boolean;
  coin: { id: string; symbol: string; name: string };
  network: { id: string; symbol: string | null; name: string };
};

export default function PublicPaymentOptionSelect({
  value,
  onChange,
  onSelect,           // <-- callback baru: kirim object terpilih
  className = "",
  params = {},
  valueKey = "id",    // "id" | "pair"
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect?: (row: Row | null) => void;
  className?: string;
  params?: PublicPaymentOptionParams;
  valueKey?: "id" | "pair";
}) {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    getPublicPaymentOptions(params).then((d) => setRows(Array.isArray(d) ? d : []));
  }, [JSON.stringify(params)]);

  useEffect(() => {
    if (!onSelect) return;
    const row = rows.find((r) => {
      const v = valueKey === "pair" ? `${r.coin.symbol}:${r.network.symbol ?? r.network.name}` : r.id;
      return v === value;
    }) ?? null;
    onSelect(row);
  }, [value, rows, valueKey, onSelect]);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`border rounded p-2 w-full ${className}`}
    >
      <option value="">Pilih Payment Option</option>
      {rows.map((r) => {
        const v = valueKey === "pair" ? `${r.coin.symbol}:${r.network.symbol ?? r.network.name}` : r.id;
        return (
          <option key={r.id} value={v}>
            {r.coin.symbol} · {r.network.symbol ?? r.network.name}
          </option>
        );
      })}
    </select>
  );
}
