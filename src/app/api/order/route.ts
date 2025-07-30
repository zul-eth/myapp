import { PrismaClient, OrderStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { generateAddress } from '@/lib/hdwallet/universal';

const prisma = new PrismaClient();

// POST: Membuat Order Baru
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      coinToBuyId,
      buyNetworkId,
      payWithId,
      payNetworkId,
      amount,
      receivingAddr,
    } = body;

    const [coinToBuy, buyNetwork, payWith, payNetwork] = await Promise.all([
      prisma.coin.findUnique({ where: { id: coinToBuyId } }),
      prisma.network.findUnique({ where: { id: buyNetworkId } }),
      prisma.coin.findUnique({ where: { id: payWithId } }),
      prisma.network.findUnique({ where: { id: payNetworkId } }),
    ]);

    if (!coinToBuy || !buyNetwork || !payWith || !payNetwork) {
      return NextResponse.json({ message: 'Coin or Network not found' }, { status: 404 });
    }

    const rateEntry = await prisma.exchangeRate.findUnique({
      where: {
        buyCoinId_buyNetworkId_payCoinId_payNetworkId: {
          buyCoinId: coinToBuyId,
          buyNetworkId,
          payCoinId: payWithId,
          payNetworkId,
        },
      },
    });

    if (!rateEntry) {
      return NextResponse.json({ message: 'Exchange rate not found' }, { status: 404 });
    }

    const index = await prisma.order.count();
    const mnemonic = process.env.MNEMONIC!;
    if (!mnemonic) {
      return NextResponse.json({ message: 'Mnemonic not configured' }, { status: 500 });
    }

    const networkType = payNetwork.name.toLowerCase();
    const addressResult = await generateAddress(networkType as any, mnemonic, index);
    const paymentAddr = addressResult?.address || addressResult;

    if (!paymentAddr || typeof paymentAddr !== 'string') {
      return NextResponse.json({ message: 'Failed to generate address' }, { status: 500 });
    }

    const newOrder = await prisma.order.create({
      data: {
        coinToBuyId,
        buyNetworkId,
        payWithId,
        payNetworkId,
        amount,
        priceRate: rateEntry.rate,
        receivingAddr,
        paymentAddr,
        status: OrderStatus.WAITING_PAYMENT,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 menit
      },
    });

    return NextResponse.json({ message: 'Order created', order: newOrder });
  } catch (error) {
    console.error('POST /api/order error:', error);
    return NextResponse.json({ message: 'Internal server error', error: String(error) }, { status: 500 });
  }
}