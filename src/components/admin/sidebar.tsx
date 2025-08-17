"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/coins", label: "Coins" },
  { href: "/admin/networks", label: "Networks" },
  { href: "/admin/coin-networks", label: "Coin Networks" },
  { href: "/admin/exchange-rates", label: "Exchange Rates" },
  { href: "/admin/payment-options", label: "Payment Options" },
  { href: "/admin/orders", label: "Orders" },

  // tambahkan menu lain bila perlu...
];

export default function Sidebar() {
  const pathname = usePathname();

  const items = useMemo(
    () =>
      NAV.map((n) => ({
        ...n,
        active:
          pathname === n.href ||
          (pathname.startsWith(n.href + "/") && n.href !== "/admin"),
      })),
    [pathname]
  );

  return (
    <aside className="hidden md:block w-64 border-r bg-white">
      <div className="h-14 border-b flex items-center px-4 font-semibold">
        MyApp Admin
      </div>
      <nav className="p-2 space-y-1">
        {items.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`block rounded px-3 py-2 text-sm ${
              n.active
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-100 text-gray-800"
            }`}
          >
            {n.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
