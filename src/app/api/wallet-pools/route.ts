// src/app/api/wallet-pools/route.ts
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

/**
 * GET /api/wallet-pools
 * Query:
 * - coinId?: string
 * - networkId?: string
 * - isUsed?: 'true' | 'false'
 * - q?: string (cari by address/xpub/id)
 * - limit?: number (default 50, max 200)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const coinId = searchParams.get('coinId') || undefined;
    const networkId = searchParams.get('networkId') || undefined;
    const isUsedParam = searchParams.get('isUsed') || undefined;
    const q = searchParams.get('q') || undefined;
    const limit = Math.min(Number(searchParams.get('limit') || 50), 200);

    const where: any = {};
    if (coinId) where.coinId = coinId;
    if (networkId) where.networkId = networkId;
    if (isUsedParam === 'true') where.isUsed = true;
    if (isUsedParam === 'false') where.isUsed = false;
    if (q) {
      where.OR = [
        { address: { contains: q, mode: 'insensitive' } },
        { xpub: { contains: q, mode: 'insensitive' } },
        { id: { contains: q, mode: 'insensitive' } },
      ];
    }

    const wallets = await prisma.walletPool.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { coin: true, network: true },
    });

    return NextResponse.json(wallets);
  } catch (error) {
    console.error('GET /api/wallet-pools error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/wallet-pools
 * body: { coinId, networkId, address, xpub? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { coinId, networkId, address, xpub } = body || {};

    if (!coinId || !networkId || !address) {
      return NextResponse.json(
        { message: 'coinId, networkId, dan address wajib diisi' },
        { status: 400 }
      );
    }

    // validasi existence
    const [coin, network] = await Promise.all([
      prisma.coin.findUnique({ where: { id: coinId } }),
      prisma.network.findUnique({ where: { id: networkId } }),
    ]);
    if (!coin || !network) {
      return NextResponse.json({ message: 'Coin atau Network tidak ditemukan' }, { status: 404 });
    }

    // cek duplikasi
    const existing = await prisma.walletPool.findFirst({
      where: {
        OR: [
          { address }, // address global unique
          { coinId, networkId, address },
        ],
      },
    });
    if (existing) {
      return NextResponse.json({ message: 'Wallet sudah ada (duplikat address)' }, { status: 409 });
    }

    const wallet = await prisma.walletPool.create({
      data: { coinId, networkId, address, xpub: xpub || null },
      include: { coin: true, network: true },
    });

    return NextResponse.json({ message: 'Wallet created', wallet });
  } catch (error) {
    console.error('POST /api/wallet-pools error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
