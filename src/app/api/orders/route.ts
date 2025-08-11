// src/app/api/orders/route.ts
import { PrismaClient, OrderStatus } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { generateAddress } from '@/lib/hdwallet/universal';

const prisma = new PrismaClient();

function mapNetworkToChains(networkName: string): { dbChain: 'evm' | 'tron' | 'solana'; runtimeChain: 'eth' | 'tron' | 'solana' } {
  const n = networkName.trim().toLowerCase();
  if (n.includes('tron') || n === 'trx') return { dbChain: 'tron', runtimeChain: 'tron' };
  if (n.includes('solana') || n === 'sol') return { dbChain: 'solana', runtimeChain: 'solana' };
  return { dbChain: 'evm', runtimeChain: 'eth' };
}

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
      const [payNetwork, rateEntry] = await Promise.all([
        tx.network.findUnique({ where: { id: payNetworkId } }),
        tx.exchangeRate.findFirst({
          where: { buyCoinId: coinToBuyId, buyNetworkId, payCoinId: payWithId, payNetworkId },
          select: { rate: true },
        }),
      ]);
      if (!payNetwork) throw new Error('Network pembayaran tidak ditemukan');
      if (!rateEntry || !Number.isFinite(Number(rateEntry.rate)) || Number(rateEntry.rate) <= 0) {
        throw new Error('Rate tidak ditemukan/invalid untuk pasangan ini');
      }

      const created = await tx.order.create({
        data: {
          coinToBuyId,
          buyNetworkId,
          payWithId,
          payNetworkId,
          amount: Number(amount),
          priceRate: Number(rateEntry.rate),
          receivingAddr,
          status: 'WAITING_PAYMENT',
        },
        select: { id: true },
      });

      const { dbChain, runtimeChain } = mapNetworkToChains(payNetwork.name);
      const cur = await tx.hdCursor.upsert({
        where: { chain: dbChain },
        update: { nextIndex: { increment: 1 } },
        create: { chain: dbChain, nextIndex: 1 },
      });
      const indexAssigned = cur.nextIndex - 1;

      const address = await generateAddress(runtimeChain as any, mnemonic, indexAssigned);
      if (!address || typeof address !== 'string') throw new Error('Gagal generate address');

      await tx.walletPoolLegacy.create({
        data: {
          chain: dbChain,
          derivationIndex: indexAssigned,
          address,
          isUsed: true,
          assignedOrder: created.id,
        },
      });

      await tx.order.update({
        where: { id: created.id },
        data: { paymentAddr: address },
      });

      return { createdOrderId: created.id };
    });

    const order = await prisma.order.findUnique({
      where: { id: createdOrderId },
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
