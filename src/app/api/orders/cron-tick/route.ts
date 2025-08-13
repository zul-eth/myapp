// src/app/api/orders/cron-tick/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { validateOrderEvm } from '@/lib/payments/validate';
import { removeAddressesFromWebhook } from '@/lib/payments/notify';
import { getEvmConfigByName } from '@/lib/payments/networkMap';

const prisma = new PrismaClient();

function auth(req: NextRequest) {
  const secret = process.env.CRON_SECRET || '';
  const hdr = req.headers.get('x-cron-key') || '';
  const q = new URL(req.url).searchParams.get('key') || '';
  return !secret || hdr === secret || q === secret;
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ message: 'unauthorized' }, { status: 401 });

  // 1) validasi order yang masih open (tanpa perubahan)
  const openOrders = await prisma.order.findMany({
    where: { status: { in: ['WAITING_PAYMENT', 'UNDERPAID', 'WAITING_CONFIRMATION'] } },
    select: { id: true },
  });
  const results = await Promise.all(openOrders.map(o => validateOrderEvm(o.id)));

  // 2) tentukan siapa yang akan expired (sebelum updateMany)
  const now = Date.now();
  const GRACE_MS = 30 * 1000;
  const toExpire = await prisma.order.findMany({
    where: {
      status: { in: ['WAITING_PAYMENT', 'UNDERPAID'] },
      expiresAt: { lt: new Date(now - GRACE_MS) },
    },
    select: { id: true, paymentAddr: true, payNetwork: { select: { name: true } } },
  });

  // 3) expire massal
  const { count: expired } = await prisma.order.updateMany({
    where: { id: { in: toExpire.map(o => o.id) } },
    data: { status: 'EXPIRED' },
  });

  // 4) cabut address dari webhook (aman jika address tidak tercatat)
  for (const o of toExpire) {
    if (!o.paymentAddr || !o.payNetwork?.name) continue;
    const evm = getEvmConfigByName(o.payNetwork.name);
    if (evm?.webhookId) {
      await removeAddressesFromWebhook(evm.webhookId, [o.paymentAddr]);
    }
  }

  return NextResponse.json({ ok: true, validated: openOrders.length, expired, details: results });
}
