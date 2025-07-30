// PUT: Update status
export async function PUT(
  req: Request,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    const { status } = await req.json();

    if (!status || !(status in OrderStatus)) {
      return NextResponse.json({ message: 'Invalid or missing status' }, { status: 400 });
    }

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // ❗ Validasi tambahan: Jangan izinkan update status tertentu ke status lain
    if (
      [OrderStatus.COMPLETED, OrderStatus.CONFIRMED].includes(existing.status) &&
      status !== existing.status
    ) {
      return NextResponse.json({ message: 'Cannot update a finalized order' }, { status: 400 });
    }

    const dataToUpdate: any = { status };

    // ⏰ Jika status menjadi UNDERPAID, set expiresAt ke 2 jam dari sekarang
    if (status === OrderStatus.UNDERPAID) {
      dataToUpdate.expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 jam
    }

    const updated = await prisma.order.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ message: 'Order status updated', order: updated });
  } catch (error) {
    console.error('PUT /api/order/:id/status error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}