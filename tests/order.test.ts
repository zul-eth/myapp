import { OrderStatus, PrismaClient } from '@prisma/client';
import { POST as createOrder } from '@/app/api/order/route';
import { GET as getOrder, PUT as updateOrder } from '@/app/api/order/[id]/route';
import { generateAddress } from '@/lib/hdwallet/universal';
import { NextRequest } from 'next/server';

jest.mock('@/lib/hdwallet/universal', () => ({
  generateAddress: jest.fn().mockResolvedValue({ address: 'mock-payment-address' }),
}));

// Inject MNEMONIC
process.env.MNEMONIC = 'test mnemonic phrase';

const prisma = new PrismaClient();
let orderId: string;

beforeAll(async () => {
  await prisma.order.deleteMany();
  await prisma.exchangeRate.deleteMany();
  await prisma.coin.deleteMany();
  await prisma.network.deleteMany();

  const coin = await prisma.coin.create({ data: { name: 'Bitcoin', symbol: 'BTC', isActive: true } });
  const payCoin = await prisma.coin.create({ data: { name: 'USDT', symbol: 'USDT', isActive: true } });

  const buyNet = await prisma.network.create({ data: { name: 'Bitcoin', isActive: true } });
  const payNet = await prisma.network.create({ data: { name: 'Ethereum', isActive: true } });

  await prisma.exchangeRate.create({
    data: {
      buyCoinId: coin.id,
      buyNetworkId: buyNet.id,
      payCoinId: payCoin.id,
      payNetworkId: payNet.id,
      rate: 0.0001,
    },
  });

  global.testData = {
    coinToBuyId: coin.id,
    buyNetworkId: buyNet.id,
    payWithId: payCoin.id,
    payNetworkId: payNet.id,
  };
});

describe('API /api/order', () => {
  it('POST: should create a new order', async () => {
    const body = {
      ...global.testData,
      amount: 1000,
      receivingAddr: 'user-wallet-address',
    };

    const req = new NextRequest('http://localhost/api/order', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
    });
    // Patch req.json for compatibility
    (req as any).json = async () => body;

    const res = await createOrder(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.message).toBe('Order created');
    expect(json.order).toHaveProperty('id');

    orderId = json.order.id;
  });

  it('GET: should return an order by ID', async () => {
    const req = new NextRequest(`http://localhost/api/orders/${orderId}`, {
      method: 'GET',
    });

    const res = await getOrder(req, { params: { id: orderId } });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.id).toBe(orderId);
  });

  it('PUT: should update order status', async () => {
    const req = new NextRequest(`http://localhost/api/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: OrderStatus.COMPLETED }),
      headers: { 'content-type': 'application/json' },
    });
    (req as any).json = async () => ({ status: OrderStatus.COMPLETED });

    const res = await updateOrder(req, { params: { id: orderId } });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.message).toBe('Order status updated');
    expect(json.order.status).toBe(OrderStatus.COMPLETED);
  });
});