"use client";

import { useEffect, useMemo, useState } from "react";

async function j(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  const t = await res.text();
  return t ? JSON.parse(t) : [];
}

export default function AdminOrdersPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const data = await j("/api/admin/orders");
    setRows(Array.isArray(data) ? data : []);
  }
  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return rows;
    return rows.filter((r) => {
      const S = [
        r.id, r.status,
        r.coinToBuy?.symbol, r.payWith?.symbol,
        r.buyNetwork?.symbol, r.payNetwork?.symbol,
        r.paymentAddr,
      ].map((x) => String(x ?? "").toLowerCase());
      return S.some((s) => s.includes(k));
    });
  }, [rows, q]);

  async function setStatus(id: string, status: string) {
    setBusy(true);
    try {
      await fetch(`/api/admin/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await refresh();
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Orders</h1>
        <a href="/admin" className="text-sm text-blue-600 hover:underline">← Dashboard</a>
      </div>

      <div className="flex gap-2 items-center">
        <input className="border rounded p-2 w-72" placeholder="Cari id/status/coin/network…" value={q} onChange={(e) => setQ(e.target.value)} />
        {q && <button className="border rounded px-2 py-1" onClick={() => setQ("")}>Reset</button>}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Pair</th>
              <th className="p-2 border">Amount · Rate</th>
              <th className="p-2 border">Pay To</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td className="p-2 border font-mono">{r.id}</td>
                <td className="p-2 border">
                  {r.buyNetwork?.symbol ?? r.buyNetwork?.name}/{r.coinToBuy?.symbol} ← {r.payNetwork?.symbol ?? r.payNetwork?.name}/{r.payWith?.symbol}
                </td>
                <td className="p-2 border">{r.amount} · rate {r.priceRate}</td>
                <td className="p-2 border">
                  <div className="font-mono">{r.paymentAddr}</div>
                  {r.paymentMemo && <div className="text-xs text-gray-500">memo: {r.paymentMemo}</div>}
                </td>
                <td className="p-2 border">{r.status}</td>
                <td className="p-2 border space-x-2">
                  <button disabled={busy} onClick={() => setStatus(r.id, "CONFIRMED")} className="px-2 py-1 rounded bg-blue-600 text-white">Mark Confirmed</button>
                  <button disabled={busy} onClick={() => setStatus(r.id, "COMPLETED")} className="px-2 py-1 rounded bg-green-600 text-white">Complete</button>
                  <button disabled={busy} onClick={() => setStatus(r.id, "CANCELED")} className="px-2 py-1 rounded bg-yellow-600 text-white">Cancel</button>
                  <button disabled={busy} onClick={() => setStatus(r.id, "EXPIRED")} className="px-2 py-1 rounded bg-gray-600 text-white">Expire</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-sm text-gray-500 p-2">Tidak ada data.</div>}
      </div>
    </div>
  );
}
