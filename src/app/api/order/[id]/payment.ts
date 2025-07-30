// PATCH: Update pembayaran manual atau via webhook
import { PrismaClient, OrderStatus } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function PATCH(req: Request, context: { params: { id: string } }) {
  try {
    const { id } = context.params;
    const { amountReceived } = await req.json();

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    const totalReceived = (order.receivedAmount || 0) + amountReceived;

    let newStatus: OrderStatus;
    let expiresAt = order.expiresAt;

    if (totalReceived < order.amount) {
      // Kurang dari total — tandai sebagai UNDERPAID, beri waktu 2 jam dari sekarang
      newStatus = OrderStatus.UNDERPAID;
      expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
    } else {
      // Cukup — tandai sebagai WAITING_CONFIRMATION, hapus expired
      newStatus = OrderStatus.WAITING_CONFIRMATION;
      expiresAt = null;
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        receivedAmount: totalReceived,
        status: newStatus,
        expiresAt,
      },
    });

    return NextResponse.json({ message: 'Payment recorded', order: updated });
  } catch (error) {
    console.error('PATCH /api/order/:id/payment error:', error);
    return NextResponse.json({ message: 'Internal server error', error: String(error) }, { status: 500 });
  }
}