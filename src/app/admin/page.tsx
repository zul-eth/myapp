'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Order } from '@/lib/api/order';

type Counts = {
  coins: number;
  networks: number;
  relations: number;
  paymentOptions: number;
  rates: number;
};

export default function AdminHomePage() {
  const [counts, setCounts] = useState<Counts>({
    coins: 0,
    networks: 0,
    relations: 0,
    paymentOptions: 0,
    rates: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErr(null);
      try {
        const [
          coinsRes,
          networksRes,
          relationsRes,
          paymentOptionsRes,
          ratesRes,
          ordersRes,
        ] = await Promise.all([
          fetch('/api/coins', { cache: 'no-store' }),
          fetch('/api/networks', { cache: 'no-store' }),
          fetch('/api/coin-network', { cache: 'no-store' }),
          fetch('/api/payment-options', { cache: 'no-store' }),
          fetch('/api/rates', { cache: 'no-store' }),
          fetch('/api/orders?limit=10', { cache: 'no-store' }), // pastikan endpoint ini sudah dibuat sebelumnya
        ]);

        const [
          coins,
          networks,
          relations,
          paymentOptions,
          rates,
          orders,
        ] = await Promise.all([
          coinsRes.ok ? coinsRes.json() : [],
          networksRes.ok ? networksRes.json() : [],
          relationsRes.ok ? relationsRes.json() : [],
          paymentOptionsRes.ok ? paymentOptionsRes.json() : [],
          ratesRes.ok ? ratesRes.json() : [],
          ordersRes.ok ? ordersRes.json() : [],
        ]);

        setCounts({
          coins: Array.isArray(coins) ? coins.length : 0,
          networks: Array.isArray(networks) ? networks.length : 0,
          relations: Array.isArray(relations) ? relations.length : 0,
          // Catatan: payment-options GET di backendmu mengembalikan yang aktif saja
          paymentOptions: Array.isArray(paymentOptions) ? paymentOptions.length : 0,
          rates: Array.isArray(rates) ? rates.length : 0,
        });

        setRecentOrders(Array.isArray(orders) ? orders : []);
      } catch (e: any) {
        setErr(e?.message || 'Gagal memuat dashboard');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="p-6 space-y-8">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Kelola aset, jaringan, metode pembayaran, rate, dan order.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/order/new" className="rounded-lg bg-black text-white px-4 py-2 text-sm">
            + Buat Order
          </Link>
          <Link href="/order" className="rounded-lg border px-4 py-2 text-sm">
            Lihat Order
          </Link>
        </div>
      </header>

      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {err}
        </div>
      )}

      {/* Stat cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Coins" value={counts.coins} href="/admin/coins" />
        <StatCard label="Networks" value={counts.networks} href="/admin/network" />
        <StatCard label="Coin ↔ Network" value={counts.relations} href="/admin/coin-network" />
        <StatCard label="Payment Options (aktif)" value={counts.paymentOptions} href="/admin/payment-options" />
        <StatCard label="Rates" value={counts.rates} href="/admin/rates" />
      </section>

      {/* Quick actions */}
      <section className="rounded-xl border p-4">
        <h2 className="font-medium mb-3">Aksi Cepat</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <QuickLink href="/admin/coins" title="Kelola Coins" />
          <QuickLink href="/admin/network" title="Kelola Networks" />
          <QuickLink href="/admin/coin-network" title="Hubungkan Coin ↔ Network" />
          <QuickLink href="/admin/payment-options" title="Payment Options" />
          <QuickLink href="/admin/rates" title="Kelola Rates" />
          <QuickLink href="/order" title="Riwayat Order" />
          <QuickLink href="/admin/wallet-pools" title="Wallet Pools" />
        </div>
      </section>

      {/* Recent orders */}
      <section className="rounded-xl border overflow-x-auto">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="font-medium">Order Terbaru</h2>
          {loading && <span className="text-sm text-gray-500">Memuat...</span>}
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-2">Order ID</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Jumlah</th>
              <th className="px-4 py-2">Rate</th>
              <th className="px-4 py-2">Dibuat</th>
              <th className="px-4 py-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                  {loading ? 'Memuat...' : 'Belum ada data'}
                </td>
              </tr>
            ) : (
              recentOrders.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="px-4 py-2 font-mono">{o.id}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                        o.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-700'
                          : o.status === 'EXPIRED' || o.status === 'FAILED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">{o.amount}</td>
                  <td className="px-4 py-2">{o.priceRate}</td>
                  <td className="px-4 py-2">
                    {o.createdAt ? new Date(o.createdAt).toLocaleString() : '-'}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link href={`/order/${o.id}`} className="rounded-lg border px-3 py-1 text-xs">
                      Detail
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="px-4 py-3">
          <Link href="/order" className="text-sm underline">Lihat semua order →</Link>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="rounded-xl border p-4 block hover:shadow-sm transition">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-3xl font-semibold mt-1">{value}</div>
      <div className="text-xs text-gray-500 mt-2">Kelola {label.toLowerCase()}</div>
    </Link>
  );
}

function QuickLink({ href, title }: { href: string; title: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border px-4 py-3 text-sm hover:shadow-sm transition text-center"
    >
      {title}
    </Link>
  );
}
