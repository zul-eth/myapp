import { PrismaClient } from '@prisma/client';
import { getEvmConfigByName } from './networkMap';
import { checkEvmPayment } from './evm';

const prisma = new PrismaClient();

function toFixedStr(n: number, decimals: number) {
  return (Math.round(n * 10 ** decimals) / 10 ** decimals).toFixed(decimals);
}

/** Jalankan validasi utk 1 order EVM dan update status-nya. */
export async function validateOrderEvm(orderId: string) {
  const o = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payWith: true, payNetwork: true },
  });
  if (!o) return { ok: false, reason: 'order-not-found' as const };

  const cfg = getEvmConfigByName(o.payNetwork.name);
  if (!cfg?.rpc) return { ok: false, reason: 'rpc-missing' as const };

  const opt: any = await prisma.paymentOption.findFirst({
    where: { coinId: o.payWithId, networkId: o.payNetworkId },
  });

  const isToken = !!opt?.contractAddress;
  const tokenMeta = {
    isNative: !isToken,
    contractAddress: isToken ? (String(opt.contractAddress) as `0x${string}`) : undefined,
    decimals: Number(opt?.decimals || (isToken ? 6 : 18)),
    minConfirmations: Number(opt?.minConfirmations ?? (isToken ? 3 : 1)), 
  };

  const expectedAmount = toFixedStr(o.amount * o.priceRate, tokenMeta.decimals);

  const res = await checkEvmPayment({
    rpcUrl: cfg.rpc,
    paymentAddr: o.paymentAddr,
    expectedAmount,
    tokenMeta,
  });

  // idempotent update
  if (res.status === 'UNDERPAID') {
    if (o.status !== 'UNDERPAID') {
      await prisma.order.update({ where: { id: o.id }, data: { status: 'UNDERPAID' } });
    }
  } else if (res.status === 'PENDING_CONF') {
    await prisma.order.update({
      where: { id: o.id },
      data: { status: 'WAITING_CONFIRMATION', txHash: res.txHash, confirmations: res.confirmations },
    });
  } else if (res.status === 'CONFIRMED') {
    await prisma.order.update({
      where: { id: o.id },
      data: { status: 'CONFIRMED', txHash: res.txHash, confirmations: res.confirmations },
    });
    
    // fire-and-forget trigger payout
    queueMicrotask(() => {
      const base = process.env.NEXT_PUBLIC_BASE_URL || '';
      fetch(`${base}/api/orders/${o.id}/deliver`, { method: 'POST' }).catch(() => {});
    });
  }
  return { ok: true, result: res };
}

