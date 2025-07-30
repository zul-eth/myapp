import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

// PUT /api/networks/:id
export async function PUT(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  const body = await req.json();

  try {
    const { name, logoUrl, isActive } = body;

    const updated = await prisma.network.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(logoUrl && { logoUrl }),
        ...(typeof isActive === 'boolean' && { isActive }),
      },
    });

    return NextResponse.json({ message: 'Network updated', network: updated });
  } catch (error) {
    console.error(`PUT /api/networks/${id} error:`, error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/networks/:id


export async function DELETE(
  req: Request,
  context: { params: { id: string } } // Ini masih valid
) {
  const { id } = await context.params; // ✅ Await di sini
  try {
    const deleted = await prisma.network.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, data: deleted });
  } catch (error) {
    console.error('Error deleting network:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}