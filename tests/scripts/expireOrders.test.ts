import { PrismaClient, OrderStatus } from '@prisma/client';
import expireOrders from '@/scripts/expireOrders';

const prisma = new PrismaClient();

let coin: any;
let network: any;
let expired1: any;
let expired2: any;
let future1: any;

beforeAll(async () => {
  // Pastikan Coin & Network tersedia
  coin = await prisma.coin.upsert({
    where: { symbol: 'USDT' },
    update: {},
    create: { symbol: 'USDT', name: 'Tether' },
  });

  network = await prisma.network.upsert({
    where: { name: 'Ethereum' },
    update: {},
    create: { name: 'Ethereum' },
  });

  const past = new Date(Date.now() - 60 * 60 * 1000); // 1 jam lalu
  const future = new Date(Date.now() + 60 * 60 * 1000); // 1 jam ke depan

  // ✅ Harus diexpire
  expired1 = await prisma.order.create({
    data: {
      coinToBuyId: coin.id,
      buyNetworkId: network.id,
      payWithId: coin.id,
      payNetworkId: network.id,
      amount: 100,
      priceRate: 1,
      receivingAddr: 'receive1',
      paymentAddr: 'pay1',
      status: OrderStatus.WAITING_PAYMENT,
      expiresAt: past,
    },
  });

  expired2 = await prisma.order.create({
    data: {
      coinToBuyId: coin.id,
      buyNetworkId: network.id,
      payWithId: coin.id,
      payNetworkId: network.id,
      amount: 200,
      priceRate: 1,
      receivingAddr: 'receive2',
      paymentAddr: 'pay2',
      status: OrderStatus.UNDERPAID,
      expiresAt: past,
    },
  });

  // ❌ Tidak boleh expire
  future1 = await prisma.order.create({
    data: {
      coinToBuyId: coin.id,
      buyNetworkId: network.id,
      payWithId: coin.id,
      payNetworkId: network.id,
      amount: 300,
      priceRate: 1,
      receivingAddr: 'receive3',
      paymentAddr: 'pay3',
      status: OrderStatus.WAITING_PAYMENT,
      expiresAt: future,
    },
  });
});

afterAll(async () => {
  const ids = [expired1?.id, expired2?.id, future1?.id].filter(Boolean);
  await prisma.order.deleteMany({ where: { id: { in: ids } } });
  await prisma.$disconnect();
});

test('expireOrders script should expire the correct orders', async () => {
  await expireOrders();

  const check1 = await prisma.order.findUnique({ where: { id: expired1.id } });
  const check2 = await prisma.order.findUnique({ where: { id: expired2.id } });
  const check3 = await prisma.order.findUnique({ where: { id: future1.id } });

  expect(check1?.status).toBe(OrderStatus.EXPIRED);
  expect(check2?.status).toBe(OrderStatus.EXPIRED);
  expect(check3?.status).toBe(OrderStatus.WAITING_PAYMENT);
});