import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();
type Params<T> = { params: Promise<T> };

// PUT /api/networks/[id]
export async function PUT(req: NextRequest, { params }: Params<{ id: string }>) {
  const { id } = await params;
  const body = await req.json();

  try {
    const { name, logoUrl, isActive } = body;
    const updated = await prisma.network.update({
      where: { id },
      data: {
        ...(typeof name === 'string' && { name }),
        ...(typeof logoUrl === 'string' || logoUrl === null ? { logoUrl } : {}),
        ...(typeof isActive === 'boolean' && { isActive }),
      },
    });
    return NextResponse.json({ message: 'Network updated', network: updated });
  } catch (error) {
    console.error(`PUT /api/networks/${id} error:`, error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/networks/[id]
export async function DELETE(_req: Request, { params }: Params<{ id: string }>) {
  const { id } = await params;
  try {
    const deleted = await prisma.network.delete({ where: { id } });
    return NextResponse.json({ success: true, data: deleted });
  } catch (error) {
    console.error('Error deleting network:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}