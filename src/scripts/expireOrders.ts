import { PrismaClient, OrderStatus } from '@prisma/client';

const prisma = new PrismaClient();

export default async function expireOrders() {
  const now = new Date();

  // Expire orders that never paid
  await prisma.order.updateMany({
    where: {
      status: OrderStatus.WAITING_PAYMENT,
      expiresAt: { lt: now },
    },
    data: { status: OrderStatus.EXPIRED },
  });

  // Expire underpaid orders after grace period
  await prisma.order.updateMany({
    where: {
      status: OrderStatus.UNDERPAID,
      expiresAt: { lt: now },
    },
    data: { status: OrderStatus.EXPIRED },
  });
}