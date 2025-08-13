// src/app/api/webhooks/alchemy/clean/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { replaceWebhookAddresses } from '@/lib/payments/notify';
import { EVM_NETWORKS } from '@/lib/payments/networkMap';

const prisma = new PrismaClient();

function auth(req: NextRequest) {
  const s = process.env.CRON_SECRET || '';
  const h = req.headers.get('x-cron-key') || '';
  const q = new URL(req.url).searchParams.get('key') || '';
  return !s || h === s || q === s;
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ message: 'unauthorized' }, { status: 401 });
  if (!process.env.ALCHEMY_NOTIFY_TOKEN) {
    return NextResponse.json({ message: 'missing ALCHEMY_NOTIFY_TOKEN' }, { status: 500 });
  }

  // 1) Ambil SEMUA address AKTIF (status open)
  const active = await prisma.order.findMany({
    where: { status: { in: ['WAITING_PAYMENT', 'UNDERPAID', 'WAITING_CONFIRMATION'] } },
    select: { paymentAddr: true, payNetwork: { select: { name: true } } },
  });

  // 2) Kelompokkan address aktif per webhook
  const byWebhook = new Map<string, Set<string>>();
  for (const o of active) {
    const addr = (o.paymentAddr ?? '').trim();
    const net = (o.payNetwork?.name ?? '').trim();
    if (!addr || !net) continue;
    const conf = (EVM_NETWORKS as any)[net];
    const webhookId: string = conf?.webhookId || '';
    if (!webhookId) continue;
    (byWebhook.get(webhookId) ?? byWebhook.set(webhookId, new Set()).get(webhookId))!.add(addr);
  }

  // 3) REPLACE daftar address di setiap webhook = “hanya yang aktif”
  const stats: Record<string, number> = {};
  for (const [webhookId, set] of byWebhook.entries()) {
    const list = [...set];
    await replaceWebhookAddresses(webhookId, list); // ⬅️ PUT replace
    stats[webhookId] = list.length;
  }

  // 4) (Opsional) Jika ada webhook yang tidak punya order aktif sama sekali,
  //     dan kamu ingin mengosongkannya, daftar semua webhookId yang kamu pakai:
  for (const name of Object.keys(EVM_NETWORKS)) {
    const conf = (EVM_NETWORKS as any)[name];
    const webhookId: string = conf?.webhookId || '';
    if (!webhookId) continue;
    if (!byWebhook.has(webhookId)) {
      await replaceWebhookAddresses(webhookId, []); // kosongkan total
      stats[webhookId] = 0;
    }
  }

  return NextResponse.json({ ok: true, replaced: stats });
}
