// src/app/api/webhooks/alchemy/route.ts
import 'server-only';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { validateOrderEvm } from '@/lib/payments/validate';

const prisma = new PrismaClient();

/** Toggle cepat via ENV tanpa sentuh handler */
function isEnabled() {
  return process.env.ALCHEMY_WEBHOOK_ENABLED === 'true';
}

/** Verifikasi HMAC signature dari Alchemy */
function verify(raw: string, sig: string, secret: string) {
  if (!sig || !secret) return false;
  const h = crypto.createHmac('sha256', secret).update(raw, 'utf8').digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(h));
  } catch {
    return false;
  }
}

/** Ekstrak daftar address dari payload (mendukung beberapa varian schema) */
function extractAddresses(payload: any): string[] {
  const acts: any[] =
    payload?.event?.activity ||
    payload?.data?.activity ||
    payload?.activity ||
    [];

  if (!Array.isArray(acts) || acts.length === 0) return [];

  // Ambil 'toAddress' (utama), fallback ke 'to', dan juga pertimbangkan transfer ERC20 (toAddress)
  const raw = acts
    .map((a) => String(a?.toAddress ?? a?.to ?? '').trim())
    .filter(Boolean);

  // (Opsional) jika perlu pantau incoming dari 'fromAddress', aktifkan ini:
  // raw.push(...acts.map(a => String(a?.fromAddress ?? a?.from ?? '').trim()).filter(Boolean));

  // Uniq case-insensitive, tapi kembalikan bentuk asli (checksum/lowercase dibolehkan oleh Alchemy)
  const seen = new Set<string>();
  const out: string[] = [];
  for (const addr of raw) {
    const key = addr.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(addr);
  }
  return out;
}

export async function POST(req: NextRequest) {
  // Matikan cepat jika tidak dibutuhkan (sinkron dengan util notify terbaru)
  if (!isEnabled()) return new NextResponse(null, { status: 204 });

  const secret = process.env.ALCHEMY_WEBHOOK_SECRET || '';
  const sig = req.headers.get('x-alchemy-signature') || '';

  // Penting: baca body asli dulu untuk verifikasi
  const raw = await req.text();

  // Tolak sedini mungkin bila signature salah
  if (!verify(raw, sig, secret)) {
    return NextResponse.json({ message: 'invalid signature' }, { status: 401 });
  }

  // Parsing aman
  let body: any;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ message: 'invalid json' }, { status: 400 });
  }

  // Ambil address dari payload
  const addresses = extractAddresses(body);
  if (addresses.length === 0) {
    // Tidak relevan → 204 agar log minim
    return new NextResponse(null, { status: 204 });
  }

  // Siapkan set lowercase untuk matching robust
  const toSet = new Set(addresses.map((a) => a.toLowerCase()));

  // Ambil kandidat order yang masih open (DB = sumber kebenaran; sinkron dengan notify clean/replace)
  const candidates = await prisma.order.findMany({
    where: { status: { in: ['WAITING_PAYMENT', 'UNDERPAID', 'WAITING_CONFIRMATION'] } },
    select: { id: true, paymentAddr: true },
    // jika traffic besar, bisa tambahkan pagination terbaru/open window
  });

  // Cocokkan di aplikasi (case-insensitive)
  const matched = candidates.filter((o) =>
    toSet.has((o.paymentAddr || '').toLowerCase())
  );

  if (matched.length === 0) {
    return new NextResponse(null, { status: 204 });
  }

  // Validasi tiap order yang match (idempotent di sisi validateOrderEvm)
  await Promise.all(matched.map((o) => validateOrderEvm(o.id)));

  return NextResponse.json({ ok: true, matched: matched.length });
}

// (Opsional) tangani HEAD/GET untuk healthcheck dari provider
export async function GET() {
  return new NextResponse(null, { status: 204 });
}
