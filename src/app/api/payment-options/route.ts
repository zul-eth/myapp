// src/app/api/payment-options/route.ts
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

/**
 * GET /api/payment-options
 * Query:
 * - q?: string  (filter by coin.symbol/name atau network.name)
 * - active?: 'true' | 'false' (default true)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || undefined;
    const activeParam = searchParams.get('active') ?? 'true';

    const where: any = {};
    if (activeParam === 'true') where.isActive = true;
    if (activeParam === 'false') where.isActive = false;

    if (q) {
      where.OR = [
        { coin: { symbol: { contains: q, mode: 'insensitive' } } },
        { coin: { name: { contains: q, mode: 'insensitive' } } },
        { network: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    // pastikan coin/network-nya juga aktif
    where.coin = { ...(where.coin || {}), isActive: true };
    where.network = { ...(where.network || {}), isActive: true };

    const rows = await prisma.paymentOption.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { coin: true, network: true },
    });

    // UI mengharapkan array langsung dengan { coin, network, id, isActive }
    return NextResponse.json(rows);
  } catch (e) {
    console.error('GET /api/payment-options error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


// POST: Tambah kombinasi coin-network untuk payment
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { coinToBuyId, buyNetworkId, payWithId, payNetworkId, amount, receivingAddr } = body || {};
    if (!coinToBuyId || !buyNetworkId || !payWithId || !payNetworkId || !amount || !receivingAddr) {
      return NextResponse.json({ message: 'Field wajib belum lengkap' }, { status: 400 });
    }

    const mnemonic = process.env.MNEMONIC;
    if (!mnemonic) return NextResponse.json({ message: 'MNEMONIC belum dikonfigurasi' }, { status: 500 });

    const { createdOrderId } = await prisma.$transaction(async (tx) => {
      // 1) ambil network pembayaran & rate
      const [payNetwork, rateEntry] = await Promise.all([
        tx.network.findUnique({ where: { id: payNetworkId } }),
        tx.exchangeRate.findFirst({
          where: { buyCoinId: coinToBuyId, buyNetworkId, payCoinId: payWithId, payNetworkId },
          select: { rate: true },
        }),
      ]);
      if (!payNetwork) throw new Error('Network pembayaran tidak ditemukan');
      const priceRate = Number(rateEntry?.rate);
      if (!Number.isFinite(priceRate) || priceRate <= 0) throw new Error('Rate tidak ditemukan/invalid untuk pasangan ini');

      // 2) tentukan chain & klaim index dari HdCursor
      const n = payNetwork.name.trim().toLowerCase();
      const dbChain: 'evm' | 'tron' | 'solana' =
        n.includes('tron') || n === 'trx' ? 'tron' : n.includes('solana') || n === 'sol' ? 'solana' : 'evm';
      const runtimeChain: 'eth' | 'tron' | 'solana' = dbChain === 'evm' ? 'eth' : (dbChain as any);

      const cur = await tx.hdCursor.upsert({
        where: { chain: dbChain },
        update: { nextIndex: { increment: 1 } },
        create: { chain: dbChain, nextIndex: 1 },
      });
      const indexAssigned = cur.nextIndex - 1;

      // 3) derive address dari HD wallet
      const address = await generateAddress(runtimeChain as any, mnemonic, indexAssigned);
      if (!address || typeof address !== 'string') throw new Error('Gagal generate address');

      // 4) buat order LANGSUNG dengan paymentAddr terisi
      const created = await tx.order.create({
        data: {
          coinToBuyId,
          buyNetworkId,
          payWithId,
          payNetworkId,
          amount: Number(amount),
          priceRate,
          receivingAddr,
          paymentAddr: address,          // <- wajib diisi saat create
          status: 'WAITING_PAYMENT',
        },
        select: { id: true },
      });

      // 5) catat ledger assignment
      await tx.walletPoolLegacy.create({
        data: {
          chain: dbChain,
          derivationIndex: indexAssigned,
          address,
          isUsed: true,
          assignedOrder: created.id,
        },
      });

      return { createdOrderId: created.id };
    });

    const order = await prisma.order.findUnique({
      where: { id: createdOrderId },
      include: { coinToBuy: true, buyNetwork: true, payWith: true, payNetwork: true },
    });

    return NextResponse.json({ message: 'Order created', order });
  } catch (error: any) {
    console.error('POST /api/orders error:', error);
    return NextResponse.json({ message: error?.message || 'Internal server error' }, { status: 500 });
  }
}
