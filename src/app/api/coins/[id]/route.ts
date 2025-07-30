// src/app/api/coins/[id]/route.ts

import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { name, symbol, logoUrl, isActive } = body;

    if (!name && !symbol && !logoUrl && typeof isActive !== 'boolean') {
      return NextResponse.json({ message: 'No fields provided to update' }, { status: 400 });
    }

    const coin = await prisma.coin.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(symbol && { symbol }),
        ...(logoUrl && { logoUrl }),
        ...(typeof isActive === 'boolean' && { isActive }),
      },
    });

    return NextResponse.json({ message: 'Coin updated', coin });
  } catch (error) {
    console.error(`PUT /api/coins/${params.id} error:`, error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: { id: string } }) {
  const { id } = context.params;

  try {
    const ordersUsingCoin = await prisma.order.findFirst({
      where: {
        OR: [
          { coinToBuyId: id },
          { payWithId: id }
        ]
      }
    });

    if (ordersUsingCoin) {
      return NextResponse.json({
        message: 'Coin sedang digunakan di order. Nonaktifkan saja.'
      }, { status: 400 });
    }

    const coin = await prisma.coin.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Coin deleted', coin });
  } catch (error) {
    console.error(`DELETE /api/coins/${id} error:`, error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}