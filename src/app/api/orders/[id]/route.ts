// Detail + Update Order
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

// GET /api/orders/:id
export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const data = await prisma.order.findUnique({
      where: { id: ctx.params.id },
      include: { coinToBuy: true, buyNetwork: true, payWith: true, payNetwork: true },
    });
    if (!data) return NextResponse.json({ message: 'Order tidak ditemukan' }, { status: 404 });
    return NextResponse.json({ message: 'OK', data });
  } catch (e: any) {
    console.error('GET /api/orders/:id error:', e);
    return NextResponse.json({ message: e?.message || 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/orders/:id
export async function PUT(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const payload: {
      status?: any;
      txHash?: string | null;
      confirmations?: number;
    } = body;

    const data = await prisma.order.update({
      where: { id: ctx.params.id },
      data: {
        ...(payload.status ? { status: payload.status } : {}),
        ...(payload.txHash !== undefined ? { txHash: payload.txHash } : {}),
        ...(typeof payload.confirmations === 'number' ? { confirmations: payload.confirmations } : {}),
      },
      include: { coinToBuy: true, buyNetwork: true, payWith: true, payNetwork: true },
    });

    return NextResponse.json({ message: 'Order updated', data });
  } catch (e: any) {
    console.error('PUT /api/orders/:id error:', e);
    return NextResponse.json({ message: e?.message || 'Internal server error' }, { status: 500 });
  }
}
