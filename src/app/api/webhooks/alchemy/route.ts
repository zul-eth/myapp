// src/app/api/webhooks/alchemy/route.ts
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { validateOrderEvm } from '@/lib/payments/validate';

const prisma = new PrismaClient();

function verify(raw: string, sig: string, secret: string) {
  if (!sig || !secret) return false;
  const h = crypto.createHmac('sha256', secret).update(raw, 'utf8').digest('hex');
  try { return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(h)); } catch { return false; }
}

export async function POST(req: NextRequest) {
  const secret = process.env.ALCHEMY_WEBHOOK_SECRET || '';
  const raw = await req.text();
  const sig = req.headers.get('x-alchemy-signature') || '';
  if (!verify(raw, sig, secret)) {
    return NextResponse.json({ message: 'invalid signature' }, { status: 401 });
  }

  const body = JSON.parse(raw);
  const acts: any[] = body?.event?.activity || body?.data?.activity || body?.activity || [];
  if (!Array.isArray(acts) || acts.length === 0) {
    return NextResponse.json({ ok: true, matched: 0 });
  }

  // 1) ambil semua toAddress dari payload (as is), lalu bikin set lowercase utk matching robust
  const rawTo = Array.from(new Set(
    acts.map(a => String(a?.toAddress ?? a?.to ?? '').trim()).filter(Boolean)
  ));
  const toSet = new Set(rawTo.map(a => a.toLowerCase()));
  if (toSet.size === 0) return NextResponse.json({ ok: true, matched: 0 });

  // 2) ambil kandidat order yg masih "open"
  const candidates = await prisma.order.findMany({
    where: {
      status: { in: ['WAITING_PAYMENT', 'UNDERPAID', 'WAITING_CONFIRMATION'] },
    },
    select: { id: true, paymentAddr: true, status: true },
    // optional throttle biar ringan:
    // orderBy: { createdAt: 'desc' }, take: 500,
  });

  // 3) match di JS (case-insensitive)
  const orders = candidates.filter(o => toSet.has((o.paymentAddr || '').toLowerCase()));
  if (orders.length === 0) {
    return NextResponse.json({ ok: true, matched: 0 });
  }

  // 4) panggil validator bersama untuk tiap order yang match
  const results = await Promise.all(orders.map(o => validateOrderEvm(o.id)));

  return NextResponse.json({ ok: true, matched: orders.length, results });
}
