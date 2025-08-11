// src/app/api/orders/route.ts
import { PrismaClient, OrderStatus } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { allocatePaymentAddressByChain } from '@/server/alloc/hdAllocator';

const prisma = new PrismaClient();

/**
 * GET /api/orders?status&limit&q
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as OrderStatus | null;
    const q = searchParams.get('q') ?? undefined;
    const limit = Math.min(Number(searchParams.get('limit') || 50), 200);

    const where: any = {};
    if (status && status in OrderStatus) where.status = status;
    if (q) where.id = { contains: q, mode: 'insensitive' as const };

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        // sesuai schema kamu
        coinToBuy: true,
        buyNetwork: true,
        payWith: true,
        payNetwork: true,
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('GET /api/orders error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/orders
 * body: { coinToBuyId, buyNetworkId, payWithId, payNetworkId, amount, receivingAddr }
 * Buat order + alokasikan alamat pembayaran berbasis chain (evm/tron/solana).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { coinToBuyId, buyNetworkId, payWithId, payNetworkId, amount, receivingAddr } = body || {};

    // validasi dasar
    if (!coinToBuyId || !buyNetworkId || !payWithId || !payNetworkId || !amount || !receivingAddr) {
      return NextResponse.json({ message: 'Field wajib belum lengkap' }, { status: 400 });
    }

    // cari rate (wajib ada)
    const rateEntry = await prisma.exchangeRate.findFirst({
      where: { buyCoinId: coinToBuyId, buyNetworkId, payCoinId: payWithId, payNetworkId },
      select: { rate: true },
    });
    if (!rateEntry) {
      return NextResponse.json({ message: 'Rate tidak ditemukan untuk pasangan ini' }, { status: 400 });
    }

    const priceRate = Number(rateEntry.rate);
    if (!Number.isFinite(priceRate) || priceRate <= 0) {
      return NextResponse.json({ message: 'Rate tidak valid' }, { status: 400 });
    }

    // buat order (paymentAddr diisi setelah allocate)
    const created = await prisma.order.create({
      data: {
        coinToBuyId,
        buyNetworkId,
        payWithId,
        payNetworkId,
        amount: Number(amount),
        priceRate,
        receivingAddr,
        status: 'WAITING_PAYMENT',
        // optional: set expiresAt
        // expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    // alokasikan alamat by chain (atomic di dalam allocator)
    await allocatePaymentAddressByChain({
      payWithId,
      payNetworkId,
      orderId: created.id,
    });

    // ambil ulang order lengkap (sudah ada paymentAddr)
    const order = await prisma.order.findUnique({
      where: { id: created.id },
      include: {
        coinToBuy: true,
        buyNetwork: true,
        payWith: true,
        payNetwork: true,
      },
    });

    return NextResponse.json({ message: 'Order created', order });
  } catch (error: any) {
    console.error('POST /api/orders error:', error);
    return NextResponse.json({ message: error?.message || 'Internal server error' }, { status: 500 });
  }
}
