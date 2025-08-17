export const dynamic = "force-dynamic";

async function j(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  const txt = await res.text();
  return txt ? JSON.parse(txt) : [];
}

export default async function AdminHome() {
  const [coins, networks, coinNetworks, rates] = await Promise.all([
    j(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/admin/coins`).catch(() => []),
    j(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/admin/networks`).catch(() => []),
    j(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/admin/coin-networks`).catch(() => []),
    j(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/admin/exchange-rates`).catch(() => []),
    j(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/admin/payment-options`).catch(() => []),
    j(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/admin/orders`).catch(() => []),
  ]);

  const cards = [
    { label: "Coins", value: coins.length, href: "/admin/coins" },
    { label: "Networks", value: networks.length, href: "/admin/networks" },
    { label: "Coin-Networks", value: coinNetworks.length, href: "/admin/coin-networks" },
    { label: "Exchange Rates", value: rates.length, href: "/admin/exchange-rates" },
    { label: "Payment Options", value: rates.length, href: "/admin/payment-options" },
    { label: "Orders", value: rates.length, href: "/admin/orders" },
  ];

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-semibold mb-3">Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cards.map((c) => (
            <a
              key={c.label}
              href={c.href}
              className="rounded-2xl border bg-white p-4 hover:shadow-md transition"
            >
              <div className="text-sm text-gray-500">{c.label}</div>
              <div className="text-3xl font-bold">{c.value}</div>
            </a>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border bg-white">
          <div className="px-4 py-3 border-b font-semibold">Coins Aktif</div>
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2">Symbol</th>
                    <th className="py-2">Name</th>
                    <th className="py-2">Active</th>
                  </tr>
                </thead>
                <tbody>
                  {coins
                    .filter((c: any) => c.isActive)
                    .slice(0, 8)
                    .map((c: any) => (
                      <tr key={c.id} className="border-b last:border-0">
                        <td className="py-2 font-mono">{c.symbol}</td>
                        <td className="py-2">{c.name}</td>
                        <td className="py-2">{c.isActive ? "Yes" : "No"}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {coins.filter((c: any) => c.isActive).length === 0 && (
                <div className="text-sm text-gray-500">Belum ada coin aktif.</div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white">
          <div className="px-4 py-3 border-b font-semibold">Rate Terbaru</div>
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2">Pair</th>
                    <th className="py-2">Rate</th>
                    <th className="py-2">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {rates.slice(0, 8).map((r: any) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-2">
                        {r.buyCoin?.symbol}/{r.payCoin?.symbol} · {r.buyNetwork?.symbol}/{r.payNetwork?.symbol}
                      </td>
                      <td className="py-2">{r.rate}</td>
                      <td className="py-2 text-gray-500">
                        {r.updatedAt ? new Date(r.updatedAt).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rates.length === 0 && (
                <div className="text-sm text-gray-500">Belum ada exchange rate.</div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
