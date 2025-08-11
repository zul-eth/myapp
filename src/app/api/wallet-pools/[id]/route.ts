import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

/**
 * PUT /api/wallet-pools/:id
 * body: { isUsed?: boolean, assignedOrder?: string|null }
 * - jika set isUsed=false → otomatis kosongkan assignedOrder bila tidak dikirim.
 */
export async function PUT(req: NextRequest, ctx: { params: { id: string } }) {
  const { id } = ctx.params;
  try {
    const body = await req.json().catch(() => ({}));
    const data: any = {};

    if (body.isUsed !== undefined) data.isUsed = Boolean(body.isUsed);
    if (body.assignedOrder !== undefined) data.assignedOrder = body.assignedOrder || null;

    if (body.isUsed === false && body.assignedOrder === undefined) {
      data.assignedOrder = null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ message: 'Tidak ada perubahan' }, { status: 400 });
    }

    const wallet = await prisma.walletPoolLegacy.update({
      where: { id },
      data,
    });

    return NextResponse.json({ message: 'Wallet updated', wallet });
  } catch (error) {
    console.error(`PUT /api/wallet-pools/${id} error:`, error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/wallet-pools/:id
 * - Hanya boleh hapus jika isUsed = false (demi keamanan)
 */
export async function DELETE(_req: NextRequest, ctx: { params: { id: string } }) {
  const { id } = ctx.params;
  try {
    const row = await prisma.walletPoolLegacy.findUnique({ where: { id } });
    if (!row) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    if (row.isUsed) {
      return NextResponse.json({ message: 'Tidak bisa hapus yang sedang digunakan' }, { status: 400 });
    }
    await prisma.walletPoolLegacy.delete({ where: { id } });
    return NextResponse.json({ message: 'Wallet deleted' });
  } catch (error) {
    console.error(`DELETE /api/wallet-pools/${id} error:`, error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
