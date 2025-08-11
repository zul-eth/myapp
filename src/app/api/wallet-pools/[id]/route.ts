// src/app/api/wallet-pools/[id]/route.ts
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

/**
 * PUT /api/wallet-pools/:id
 * body: { address?, xpub?, isUsed?, assignedOrder? }
 * - Jika isUsed = false → assignedOrder akan dikosongkan.
 */
export async function PUT(req: NextRequest, context: { params: { id: string } }) {
  const { id } = context.params;
  try {
    const body = await req.json().catch(() => ({}));
    const data: any = {};

    if (body.address !== undefined) {
      if (!String(body.address).trim()) {
        return NextResponse.json({ message: 'Address tidak valid' }, { status: 400 });
      }
      // pastikan tidak duplikat address lain
      const clash = await prisma.walletPool.findFirst({
        where: { address: body.address, NOT: { id } },
        select: { id: true },
      });
      if (clash) {
        return NextResponse.json({ message: 'Address sudah dipakai wallet lain' }, { status: 409 });
      }
      data.address = String(body.address);
    }

    if (body.xpub !== undefined) {
      data.xpub = body.xpub ? String(body.xpub) : null;
    }

    if (body.isUsed !== undefined) {
      data.isUsed = Boolean(body.isUsed);
      if (!data.isUsed) {
        data.assignedOrder = null; // kosongkan jika dilepas
      }
    }

    if (body.assignedOrder !== undefined) {
      data.assignedOrder = body.assignedOrder ? String(body.assignedOrder) : null;
      // saat set assignedOrder, otomatis isUsed=true
      if (data.assignedOrder) data.isUsed = true;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ message: 'Tidak ada perubahan' }, { status: 400 });
    }

    const wallet = await prisma.walletPool.update({
      where: { id },
      data,
      include: { coin: true, network: true },
    });

    return NextResponse.json({ message: 'Wallet updated', wallet });
  } catch (error) {
    console.error(`PUT /api/wallet-pools/${id} error:`, error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/wallet-pools/:id
 * - Tolak hapus bila isUsed = true (demi keamanan).
 */
export async function DELETE(_req: NextRequest, context: { params: { id: string } }) {
  const { id } = context.params;
  try {
    const row = await prisma.walletPool.findUnique({ where: { id } });
    if (!row) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    if (row.isUsed) {
      return NextResponse.json({ message: 'Tidak bisa hapus wallet yang sedang digunakan' }, { status: 400 });
    }

    await prisma.walletPool.delete({ where: { id } });
    return NextResponse.json({ message: 'Wallet deleted' });
  } catch (error) {
    console.error(`DELETE /api/wallet-pools/${id} error:`, error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
