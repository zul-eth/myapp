"use client";
import { useState } from "react";

export default function RatesPage() {
  const [result, setResult] = useState<any>(null);
  const [params, setParams] = useState({
    buyCoinId: "",
    buyNetworkId: "",
    payCoinId: "",
    payNetworkId: ""
  });

  const fetchRate = async () => {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`/api/client/rates/latest?${q}`);
    setResult(await res.json());
  };

  return (
    <div className="p-4 space-y-2">
      <h1 className="text-xl font-bold mb-4">Get Latest Rate</h1>
      {Object.keys(params).map((k) => (
        <input key={k} placeholder={k} value={(params as any)[k]}
          onChange={e => setParams({ ...params, [k]: e.target.value })}
          className="border p-1 block"
        />
      ))}
      <button onClick={fetchRate} className="bg-blue-500 text-white px-2 py-1">Fetch Rate</button>
      {result && <pre className="bg-gray-100 p-2 mt-2">{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
