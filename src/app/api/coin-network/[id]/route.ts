// src/app/api/coin-network/[id]/route.ts
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

// PUT api/coin-network/:id — Aktif/nonaktifkan koneksi
export async function PUT(req: NextRequest, context: { params: { id: string } }) {
  const { id } = context.params;
  try {
    const { isActive } = await req.json();
    const updated = await prisma.coinNetwork.update({
      where: { id },
      data: { isActive: Boolean(isActive) },
      include: { coin: true, network: true },
    });
    return NextResponse.json({ message: 'Relation updated', relation: updated });
  } catch (error) {
    console.error(`PUT /api/coin-network/${id} error:`, error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE api/coin-network/:id — Hapus relasi coin ↔ network
export async function DELETE(_req: NextRequest, context: { params: { id: string } }) {
  const { id } = context.params;
  try {
    await prisma.coinNetwork.delete({ where: { id } });
    return NextResponse.json({ message: 'Relation deleted' });
  } catch (error) {
    console.error(`DELETE /api/coin-network/${id} error:`, error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
