// src/app/api/wallet-pools/allocate/route.ts
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

/**
 * POST /api/wallet-pools/allocate
 * body: { coinId, networkId, orderId? }
 * Ambil wallet pertama yang belum dipakai dan tandai dipakai.
 */
export async function POST(req: Request) {
  try {
    const { coinId, networkId, orderId } = await req.json();

    if (!coinId || !networkId) {
      return NextResponse.json({ message: 'coinId dan networkId wajib diisi' }, { status: 400 });
    }

    const wallet = await prisma.walletPool.findFirst({
      where: { coinId, networkId, isUsed: false },
      orderBy: { createdAt: 'asc' },
      include: { coin: true, network: true },
    });

    if (!wallet) {
      return NextResponse.json({ message: 'Tidak ada wallet tersedia' }, { status: 404 });
    }

    const updated = await prisma.walletPool.update({
      where: { id: wallet.id },
      data: { isUsed: true, assignedOrder: orderId || null },
      include: { coin: true, network: true },
    });

    return NextResponse.json({ message: 'Wallet allocated', wallet: updated });
  } catch (error) {
    console.error('POST /api/wallet-pools/allocate error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
