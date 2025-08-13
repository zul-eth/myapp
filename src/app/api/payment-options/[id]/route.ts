// src/app/api/payment-options/[id]/route.ts
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();
type Params<T> = { params: Promise<T> };

// PUT /api/payment-options/[id] — update status aktif/nonaktif
export async function PUT(req: Request, { params }: Params<{ id: string }>) {
  try {
    const { id } = await params; // ✅ wajib await
    const { isActive } = await req.json();

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ message: 'isActive must be a boolean' }, { status: 400 });
    }

    const updated = await prisma.paymentOption.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json({ message: 'Payment option updated', paymentOption: updated });
  } catch (error) {
    console.error('PUT /api/payment-options/[id] error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/payment-options/[id]
export async function DELETE(_req: Request, { params }: Params<{ id: string }>) {
  try {
    const { id } = await params; // ✅ wajib await
    await prisma.paymentOption.delete({ where: { id } });
    return NextResponse.json({ message: 'Payment option deleted' });
  } catch (error) {
    console.error('DELETE /api/payment-options/[id] error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}