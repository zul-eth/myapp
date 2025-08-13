// src/app/api/webhooks/alchemy/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { removeAddressesFromWebhook, addAddressesToWebhook } from '@/lib/payments/notify';
import { EVM_NETWORKS } from '@/lib/payments/networkMap';

const prisma = new PrismaClient();

function auth(req: NextRequest) {
  const secret = process.env.CRON_SECRET || '';
  const hdr = req.headers.get('x-cron-key') || '';
  const q = new URL(req.url).searchParams.get('key') || '';
  return !secret || hdr === secret || q === secret;
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ message: 'unauthorized' }, { status: 401 });

  // 1) Address aktif (harus dimonitor): status open + ada paymentAddr + belum expired
  const active = await prisma.order.findMany({
    where: {
      status: { in: ['WAITING_PAYMENT', 'UNDERPAID', 'WAITING_CONFIRMATION'] },
      paymentAddr: { not: null },
    },
    select: { paymentAddr: true, payNetwork: { select: { name: true } } },
  });

  // 2) Address non-aktif (boleh dicabut): status final
  const stale = await prisma.order.findMany({
    where: {
      status: { in: ['COMPLETED', 'EXPIRED', 'FAILED'] },
      paymentAddr: { not: null },
    },
    select: { paymentAddr: true, payNetwork: { select: { name: true } } },
  });

  // 3) Kelompokkan per network (Webhook Alchemy per jaringan)
  const byNetAdd: Record<string, Set<string>> = {};
  const byNetRem: Record<string, Set<string>> = {};

  for (const o of active) {
    const net = o.payNetwork?.name || '';
    const webhookId = EVM_NETWORKS[net as keyof typeof EVM_NETWORKS]?.webhookId || '';
    if (!webhookId || !o.paymentAddr) continue;
    (byNetAdd[webhookId] ||= new Set()).add(o.paymentAddr.toLowerCase());
  }

  for (const o of stale) {
    const net = o.payNetwork?.name || '';
    const webhookId = EVM_NETWORKS[net as keyof typeof EVM_NETWORKS]?.webhookId || '';
    if (!webhookId || !o.paymentAddr) continue;
    (byNetRem[webhookId] ||= new Set()).add(o.paymentAddr.toLowerCase());
  }

  // 4) Eksekusi add/remove dalam batch
  const ops: any[] = [];
  for (const [webhookId, set] of Object.entries(byNetAdd)) {
    ops.push(addAddressesToWebhook(webhookId, [...set]));
  }
  for (const [webhookId, set] of Object.entries(byNetRem)) {
    ops.push(removeAddressesFromWebhook(webhookId, [...set]));
  }
  await Promise.all(ops);

  return NextResponse.json({
    ok: true,
    add_webhooks: Object.fromEntries(Object.entries(byNetAdd).map(([k, v]) => [k, v.size])),
    remove_webhooks: Object.fromEntries(Object.entries(byNetRem).map(([k, v]) => [k, v.size])),
  });
}
