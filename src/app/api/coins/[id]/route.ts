// src/app/api/coins/[id]/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// util tipe agar konsisten dengan Next (params harus di-await)
type Params<T> = { params: Promise<T> };

/** GET /api/coins/[id] */
export async function GET(_req: Request, { params }: Params<{ id: string }>) {
  const { id } = await params;

  const coin = await prisma.coin.findUnique({
    where: { id },
    include: {
      networks: true,
      paymentOptions: true,
      buyRates: true,
      payRates: true,
      ordersToBuy: { select: { id: true }, take: 1 },
      ordersToPay: { select: { id: true }, take: 1 },
    },
  });

  if (!coin) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(coin);
}

/** PUT /api/coins/[id] */
export async function PUT(req: Request, { params }: Params<{ id: string }>) {
  const { id } = await params;
  const body = await req.json();

  // batasi field yg boleh diupdate sesuai model Coin
  const data: any = {};
  if (typeof body.symbol === 'string') data.symbol = body.symbol;
  if (typeof body.name === 'string') data.name = body.name;
  if (typeof body.logoUrl === 'string' || body.logoUrl === null) data.logoUrl = body.logoUrl;
  if (typeof body.isActive === 'boolean') data.isActive = body.isActive;

  const updated = await prisma.coin.update({ where: { id }, data });
  return NextResponse.json(updated);
}

/** DELETE /api/coins/[id] */
export async function DELETE(_req: Request, { params }: Params<{ id: string }>) {
  const { id } = await params;

  // Cek semua referensi yang mengacu ke Coin.id
  const [ordersCount, ratesCount, payOptCount, netMapCount] = await Promise.all([
    prisma.order.count({
      where: { OR: [{ coinToBuyId: id }, { payWithId: id }] },
    }),
    prisma.exchangeRate.count({
      where: { OR: [{ buyCoinId: id }, { payCoinId: id }] },
    }),
    prisma.paymentOption.count({ where: { coinId: id } }),
    prisma.coinNetwork.count({ where: { coinId: id } }),
  ]);

  if (ordersCount + ratesCount + payOptCount + netMapCount > 0) {
    const blocks: string[] = [];
    if (ordersCount) blocks.push(`Order (${ordersCount})`);
    if (ratesCount) blocks.push(`ExchangeRate (${ratesCount})`);
    if (payOptCount) blocks.push(`PaymentOption (${payOptCount})`);
    if (netMapCount) blocks.push(`CoinNetwork (${netMapCount})`);

    return NextResponse.json(
      {
        error:
          'Coin masih dipakai dan tidak bisa dihapus. Lepaskan semua referensi terlebih dahulu.',
        details: blocks,
      },
      { status: 400 }
    );
  }

  await prisma.coin.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}