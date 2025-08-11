'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCoins } from '@/lib/api/coin';
import { getNetworks } from '@/lib/api/network';
import { getRelations } from '@/lib/api/coinNetwork';
import { getRates } from '@/lib/api/rates';
import { createOrder } from '@/lib/api/orders';
import type { Coin } from '@/types/coin';
import type { Network } from '@/types/network';
import type { CoinNetworkRelation } from '@/types/coinNetwork';
import type { ExchangeRate } from '@/types/exchangeRate';

export default function NewOrderPage() {
  const router = useRouter();

  const [coins, setCoins] = useState<Coin[]>([]);
  const [networks, setNetworks] = useState<Network[]>([]);
  const [relations, setRelations] = useState<CoinNetworkRelation[]>([]);
  const [rates, setRates] = useState<ExchangeRate[]>([]);

  const [coinToBuyId, setCoinToBuyId] = useState('');
  const [buyNetworkId, setBuyNetworkId] = useState('');
  const [payWithId, setPayWithId] = useState('');
  const [payNetworkId, setPayNetworkId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [receivingAddr, setReceivingAddr] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [c, n, r, rateList] = await Promise.all([
          getCoins(),
          getNetworks(),
          getRelations(),
          getRates({ active: 'true' }),
        ]);
        setCoins(c);
        setNetworks(n);
        setRelations(r);
        setRates(rateList);
      } catch (e: any) {
        setErr(e?.message || 'Gagal memuat data awal');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const buyNetworksForCoin = useMemo(() => {
    if (!coinToBuyId) return networks;
    const allowedIds = new Set(
      relations
        .filter((x) => x.coinId === coinToBuyId)
        .map((x) => x.networkId)
    );
    return networks.filter((n) => allowedIds.has(n.id));
  }, [coinToBuyId, relations, networks]);

  const payNetworksForCoin = useMemo(() => {
    if (!payWithId) return networks;
    const allowedIds = new Set(
      relations
        .filter((x) => x.coinId === payWithId)
        .map((x) => x.networkId)
    );
    return networks.filter((n) => allowedIds.has(n.id));
  }, [payWithId, relations, networks]);

  const activeRate = useMemo(() => {
    if (!coinToBuyId || !buyNetworkId || !payWithId || !payNetworkId) return undefined;
    return rates.find(
      (r) =>
        r.buyCoin.id === coinToBuyId &&
        r.buyNetwork.id === buyNetworkId &&
        r.payCoin.id === payWithId &&
        r.payNetwork.id === payNetworkId
    );
  }, [rates, coinToBuyId, buyNetworkId, payWithId, payNetworkId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeRate) {
      setErr('Rate untuk pasangan tersebut tidak tersedia.');
      return;
    }
    if (!amount || amount <= 0) {
      setErr('Jumlah harus lebih dari 0.');
      return;
    }
    if (!receivingAddr) {
      setErr('Alamat penerima wajib diisi.');
      return;
    }

    try {
      setSubmitting(true);
      setErr(null);
      const res = await createOrder({
        coinToBuyId,
        buyNetworkId,
        payWithId,
        payNetworkId,
        amount,
        receivingAddr,
      });

      // simpan ke localStorage agar "My Orders" di device ini bisa menampilkan
      try {
        const key = 'myOrders';
        const cur = JSON.parse(localStorage.getItem(key) || '[]') as string[];
        if (!cur.includes(res.data.id)) {
          localStorage.setItem(key, JSON.stringify([res.data.id, ...cur].slice(0, 50)));
        }
      } catch {}

      router.push(`/order/${res.data.id}`);
    } catch (e: any) {
      setErr(e?.message || 'Gagal membuat order');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-xl font-semibold">Buat Order Baru</h1>

      {err ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>
      ) : null}

      {loading ? (
        <div className="text-sm text-gray-500">Memuat…</div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          {/* BUY */}
          <section className="rounded-xl border p-4">
            <h2 className="mb-3 text-sm font-semibold">Yang dibeli</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Coin">
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={coinToBuyId}
                  onChange={(e) => {
                    setCoinToBuyId(e.target.value);
                    setBuyNetworkId('');
                  }}
                >
                  <option value="">Pilih coin</option>
                  {coins.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.symbol} — {c.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Network">
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={buyNetworkId}
                  onChange={(e) => setBuyNetworkId(e.target.value)}
                  disabled={!coinToBuyId}
                >
                  <option value="">Pilih network</option>
                  {buyNetworksForCoin.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Jumlah">
                <input
                  type="number"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={amount || ''}
                  min={0}
                  onChange={(e) => setAmount(parseFloat(e.target.value || '0'))}
                  placeholder="0.00"
                />
              </Field>

              <Field label="Alamat penerima (wallet kamu)">
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm font-mono"
                  value={receivingAddr}
                  onChange={(e) => setReceivingAddr(e.target.value)}
                  placeholder="0x… / TR… / SoL…"
                />
              </Field>
            </div>
          </section>

          {/* PAY */}
          <section className="rounded-xl border p-4">
            <h2 className="mb-3 text-sm font-semibold">Pembayaran</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Bayar dengan (coin)">
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={payWithId}
                  onChange={(e) => {
                    setPayWithId(e.target.value);
                    setPayNetworkId('');
                  }}
                >
                  <option value="">Pilih coin</option>
                  {coins.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.symbol} — {c.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Network pembayaran">
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={payNetworkId}
                  onChange={(e) => setPayNetworkId(e.target.value)}
                  disabled={!payWithId}
                >
                  <option value="">Pilih network</option>
                  {payNetworksForCoin.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="mt-3 rounded-lg border p-3 text-sm">
              <div className="flex items-center justify-between">
                <span>Rate aktif</span>
                <span className="font-medium">
                  {activeRate ? `${activeRate.rate}` : '—'}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Rate diambil dari konfigurasi admin (ExchangeRate) berdasarkan pasangan coin+network.
              </p>
            </div>
          </section>

          <div className="flex items-center gap-2">
            <button
              disabled={
                submitting ||
                !coinToBuyId ||
                !buyNetworkId ||
                !payWithId ||
                !payNetworkId ||
                !amount ||
                !receivingAddr ||
                !activeRate
              }
              className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              {submitting ? 'Membuat…' : 'Buat Order'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1 text-sm">
      <div className="text-xs text-gray-600">{label}</div>
      {children}
    </label>
  );
}
