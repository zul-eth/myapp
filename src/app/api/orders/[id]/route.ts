// src/app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, OrderStatus } from '@prisma/client';
import { removeAddressesFromWebhook } from '@/lib/payments/notify';
import { getEvmConfigByName } from '@/lib/payments/networkMap';

const prisma = new PrismaClient();

const FINAL_STATUSES: OrderStatus[] = ['COMPLETED', 'EXPIRED', 'FAILED'];

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const payload = await req.json();

    // update status/tx/confirmations seperti semula
    const data = await prisma.order.update({
      where: { id },
      data: {
        ...(payload.status ? { status: payload.status } : {}),
        ...(payload.txHash !== undefined ? { txHash: payload.txHash } : {}),
        ...(typeof payload.confirmations === 'number'
          ? { confirmations: payload.confirmations }
          : {}),
      },
      include: { buyNetwork: true, payNetwork: true },
    });

    // ⬇️ jika status final → cabut address dari webhook
    if (FINAL_STATUSES.includes(data.status) && data.paymentAddr && data.payNetwork?.name) {
      const evm = getEvmConfigByName(data.payNetwork.name);
      if (evm?.webhookId) {
        await removeAddressesFromWebhook(evm.webhookId, [data.paymentAddr]);
      }
    }

    return NextResponse.json({ message: 'Order updated', data });
  } catch (e: any) {
    console.error('PUT /api/orders/:id error:', e);
    return NextResponse.json(
      { message: e?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


// GET /api/orders/:id
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }   // ⬅︎ params jadi Promise
) {
  try {
    const { id } = await ctx.params;         // ⬅︎ await di sini
    const data = await prisma.order.findUnique({
      where: { id },
      include: { coinToBuy: true, buyNetwork: true, payWith: true, payNetwork: true },
    });
    if (!data) return NextResponse.json({ message: 'Order tidak ditemukan' }, { status: 404 });
    return NextResponse.json({ message: 'OK', data });
  } catch (e: any) {
    console.error('GET /api/orders/:id error:', e);
    return NextResponse.json({ message: e?.message || 'Internal server error' }, { status: 500 });
  }
}