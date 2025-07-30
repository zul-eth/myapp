import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// GET: List semua payment option aktif
export async function GET() {
  try {
    const options = await prisma.paymentOption.findMany({
      where: { isActive: true },
      include: {
        coin: true,
        network: true
      }
    });

    const result = options.map(opt => ({
      id: opt.id,
      coin: {
        id: opt.coin.id,
        symbol: opt.coin.symbol,
        name: opt.coin.name,
        logoUrl: opt.coin.logoUrl
      },
      network: {
        id: opt.network.id,
        name: opt.network.name,
        logoUrl: opt.network.logoUrl
      }
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching payment options:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST: Tambah kombinasi coin-network untuk payment
export async function POST(req: Request) {
  try {
    const { coinId, networkId } = await req.json();

    if (!coinId || !networkId) {
      return NextResponse.json({ message: 'coinId and networkId are required' }, { status: 400 });
    }

    const [coin, network] = await Promise.all([
      prisma.coin.findUnique({ where: { id: coinId } }),
      prisma.network.findUnique({ where: { id: networkId } })
    ]);

    if (!coin || !network) {
      return NextResponse.json({ message: 'Coin or Network not found' }, { status: 404 });
    }

    const paymentOption = await prisma.paymentOption.upsert({
      where: { coinId_networkId: { coinId, networkId } },
      update: { isActive: true },
      create: { coinId, networkId }
    });

    return NextResponse.json({ message: 'Payment option created', paymentOption });
  } catch (error) {
    console.error('POST /api/payment-options error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}