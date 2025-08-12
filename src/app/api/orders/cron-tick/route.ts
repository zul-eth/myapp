// src/app/api/orders/cron-tick/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { validateOrderEvm } from '@/lib/payments/validate';

const prisma = new PrismaClient();

function auth(req: NextRequest) {
  const secret = process.env.CRON_SECRET || '';
  const hdr = req.headers.get('x-cron-key') || '';
  const q = new URL(req.url).searchParams.get('key') || '';
  return !secret || hdr === secret || q === secret;
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ message: 'unauthorized' }, { status: 401 });

  // 1) retry-validate
  const openOrders = await prisma.order.findMany({
    where: { status: { in: ['WAITING_PAYMENT', 'UNDERPAID', 'WAITING_CONFIRMATION'] } },
    select: { id: true },
    take: 50,
  });
  const results: any[] = [];
  for (const o of openOrders) results.push(await validateOrderEvm(o.id));

  // 2) expire (grace 30s, hanya status yang expirable)
  const now = Date.now();
  const GRACE_MS = 30 * 1000;
  const { count: expired } = await prisma.order.updateMany({
    where: {
      status: { in: ['WAITING_PAYMENT', 'UNDERPAID'] },
      expiresAt: { lt: new Date(now - GRACE_MS) },
    },
    data: { status: 'EXPIRED' },
  });

  return NextResponse.json({ ok: true, validated: openOrders.length, expired, details: results });
}
