import { NextRequest, NextResponse } from 'next/server';
import { validateOrderEvm } from '@/lib/payments/validate';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params; // Next 15: params harus di-await
  const r = await validateOrderEvm(id);
  if (!r.ok) return NextResponse.json(r, { status: 400 });
  return NextResponse.json({ message: 'validated', result: r.result });
}
