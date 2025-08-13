// src/app/api/rates/[id]/route.ts
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();
type Params<T> = { params: Promise<T> };

/**
 * PUT /api/rates/[id]
 * body: { rate?: number, updatedBy?: string }
 */
export async function PUT(req: NextRequest, { params }: Params<{ id: string }>) {
  const { id } = await params; // ✅ wajib await
  try {
    const body = await req.json().catch(() => ({} as any));

    const actor =
      body?.updatedBy ||
      req.headers.get('x-actor') ||
      req.headers.get('x-admin') ||
      null;

    const data: any = {};
    if (body.rate !== undefined) {
      const parsed = Number(body.rate);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return NextResponse.json({ message: 'Rate tidak valid' }, { status: 400 });
      }
      data.rate = parsed;
    }
    if (actor) data.updatedBy = actor;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ message: 'Tidak ada perubahan' }, { status: 400 });
    }

    const updated = await prisma.exchangeRate.update({
      where: { id },
      data,
      include: {
        buyCoin: true,
        buyNetwork: true,
        payCoin: true,
        payNetwork: true,
      },
    });

    return NextResponse.json({ message: 'Rate updated', rate: updated });
  } catch (error) {
    console.error(`PUT /api/rates/${id} error:`, error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/rates/[id]
 */
export async function DELETE(_req: NextRequest, { params }: Params<{ id: string }>) {
  const { id } = await params; // ✅ wajib await
  try {
    await prisma.exchangeRate.delete({ where: { id } });
    return NextResponse.json({ message: 'Rate deleted' });
  } catch (error) {
    console.error(`DELETE /api/rates/${id} error:`, error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}