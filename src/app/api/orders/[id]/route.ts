// src/app/api/orders/[id]/route.ts
import { PrismaClient, OrderStatus } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

// GET /api/orders/:id
export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: ctx.params.id },
      include: {
        coinToBuy: true,
        buyNetwork: true,
        payWith: true,
        payNetwork: true,
      },
    });
    if (!order) return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    return NextResponse.json(order);
  } catch (e) {
    console.error('GET /api/orders/:id error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/orders/:id   body: { status: OrderStatus }
export async function PUT(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const { status } = await req.json();
    if (!status || !(status in OrderStatus)) {
      return NextResponse.json({ message: 'Status tidak valid' }, { status: 400 });
    }

    const updated = await prisma.order.update({
      where: { id: ctx.params.id },
      data: { status },
      include: {
        coinToBuy: true,
        buyNetwork: true,
        payWith: true,
        payNetwork: true,
      },
    });

    return NextResponse.json({ message: 'Order updated', order: updated });
  } catch (e) {
    console.error('PUT /api/orders/:id error:', e);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
