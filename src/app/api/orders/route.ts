// List + Create Orders
import { PrismaClient, OrderStatus } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { dbToRuntimeChain } from '@/lib/hdwallet/chainMap';
import { generateAddress } from '@/lib/hdwallet/universal';

// ⬇️ pastikan path import sesuai file helper kamu
import { addAddressesToWebhook } from '@/lib/payments/notify';
import { getEvmConfigByName } from '@/lib/payments/networkMap';

const prisma = new PrismaClient();
const PAYMENT_WINDOW_MINUTES = 15;

function mapNetworkToDbChain(networkName: string): 'evm' | 'tron' | 'solana' {
  const n = (networkName || '').trim().toLowerCase();
  if (n.includes('tron') || n === 'trx') return 'tron';
  if (n.includes('solana') || n === 'sol') return 'solana';
  return 'evm';
}

// GET /api/orders
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const status = (searchParams.get('status') || '') as OrderStatus | '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const where = {
      AND: [
        status ? { status } : {},
        q
          ? {
              OR: [
                { id: { contains: q, mode: 'insensitive' } },
                { receivingAddr: { contains: q, mode: 'insensitive' } },
                { paymentAddr: { contains: q, mode: 'insensitive' } },
                { txHash: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {},
      ],
    };

    const [total, data] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { coinToBuy: true, buyNetwork: true, payWith: true, payNetwork: true },
      }),
    ]);

    return NextResponse.json({ message: 'OK', data, page, limit, total });
  } catch (e: any) {
    console.error('GET /api/orders error:', e);
    return NextResponse.json({ message: e?.message || 'Internal server error' }, { status: 500 });
  }
}

// POST /api/orders
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { coinToBuyId, buyNetworkId, payWithId, payNetworkId, amount, receivingAddr } = body || {};

    if (!coinToBuyId || !buyNetworkId || !payWithId || !payNetworkId || !amount || !receivingAddr) {
      return NextResponse.json({ message: 'Data tidak lengkap' }, { status: 400 });
    }

    // cek network bayar -> tentukan chain db ('evm'|'tron'|'solana')
    const payNet = await prisma.network.findUnique({ where: { id: payNetworkId } });
    if (!payNet) return NextResponse.json({ message: 'Network pembayaran tidak ditemukan' }, { status: 404 });
    const dbChain = mapNetworkToDbChain(payNet.name);
    const runtimeChain = dbToRuntimeChain(dbChain);

    // ambil rate
    const rateRow = await prisma.exchangeRate.findFirst({
      where: { buyCoinId: coinToBuyId, buyNetworkId, payCoinId: payWithId, payNetworkId },
    });
    if (!rateRow) return NextResponse.json({ message: 'Rate tidak ditemukan' }, { status: 404 });

    // ambil 1 wallet pool yang belum dipakai
    let wallet = await prisma.walletPoolLegacy.findFirst({
      where: { chain: dbChain, isUsed: false },
      orderBy: { derivationIndex: 'asc' },
    });

    // kalau kosong, derive 1 on-demand
    if (!wallet) {
      const MNEMONIC = process.env.MNEMONIC;
      if (!MNEMONIC) return NextResponse.json({ message: 'MNEMONIC belum diset' }, { status: 500 });

      const cursor = await prisma.hdCursor.upsert({
        where: { chain: dbChain },
        update: {},
        create: { chain: dbChain, nextIndex: 0 },
      });

      const index = cursor.nextIndex;
      const address = await generateAddress(runtimeChain, MNEMONIC, index);

      wallet = await prisma.walletPoolLegacy.create({
        data: { chain: dbChain, derivationIndex: index, address, isUsed: false },
      });

      // advance cursor
      await prisma.hdCursor.update({
        where: { chain: dbChain },
        data: { nextIndex: { increment: 1 } },
      });
    }

    const expiresAt = new Date(Date.now() + PAYMENT_WINDOW_MINUTES * 60 * 1000);

    // buat order
    const order = await prisma.order.create({
      data: {
        coinToBuyId, buyNetworkId, payWithId, payNetworkId,
        amount, priceRate: rateRow.rate,
        receivingAddr,
        paymentAddr: wallet.address,
        paymentMemo: null,
        txHash: null,
        confirmations: 0,
        status: 'WAITING_PAYMENT',
        expiresAt,
      },
      include: { coinToBuy: true, buyNetwork: true, payWith: true, payNetwork: true },
    });

    // ⬇️ DAFTARKAN paymentAddr ke Webhook Alchemy
    try {
      const cfg = getEvmConfigByName(order.payNetwork.name);
      if (cfg?.webhookId && process.env.ALCHEMY_NOTIFY_TOKEN) {
        await addAddressesToWebhook(cfg.webhookId, [order.paymentAddr]);
      }
    } catch (e) {
      console.warn('register webhook address failed:', e);
    }

    // tandai wallet sudah dipakai & assign ke order
    await prisma.walletPoolLegacy.update({
      where: { id: wallet.id },
      data: { isUsed: true, assignedOrder: order.id },
    });

    return NextResponse.json({ message: 'Order created', data: order }, { status: 201 });
  } catch (e: any) {
    console.error('POST /api/orders error:', e);
    return NextResponse.json({ message: e?.message || 'Internal server error' }, { status: 500 });
  }
}
