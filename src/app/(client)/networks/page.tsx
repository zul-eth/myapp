"use client";
import useSWR from "swr";
const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function NetworksPage() {
  const { data, error } = useSWR("/api/client/networks", fetcher);
  if (error) return <div>Error loading networks</div>;
  if (!data) return <div>Loading...</div>;
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Networks</h1>
      <ul className="space-y-2">
        {data.map((net: any) => (
          <li key={net.id} className="border p-2 rounded">
            {net.logoUrl && <img src={net.logoUrl} className="w-6 h-6 inline-block mr-2" />}
            {net.name} ({net.symbol || net.family})
          </li>
        ))}
      </ul>
    </div>
  );
}
