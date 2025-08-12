// src/app/api/orders/[id]/deliver/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { JsonRpcProvider, Wallet, Contract, parseUnits } from 'ethers';
import { getEvmConfigByName } from '@/lib/payments/networkMap';
import { removeAddressesFromWebhook } from '@/lib/payments/notify';

const prisma = new PrismaClient();

const ERC20_ABI = [
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
];

function toFixedStr(n: number, decimals: number) {
  return (Math.round(n * 10 ** decimals) / 10 ** decimals).toFixed(decimals);
}

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;

    // 1) Ambil order
    const order = await prisma.order.findUnique({
      where: { id },
      include: { coinToBuy: true, buyNetwork: true, payWith: true, payNetwork: true },
    });
    if (!order) return NextResponse.json({ message: 'Order not found' }, { status: 404 });

    // Idempotent guard
    if (order.status === 'COMPLETED') {
      return NextResponse.json({ message: 'Already completed', data: { payoutHash: order.payoutHash ?? null } });
    }
    if (order.payoutHash) {
      await prisma.order.update({ where: { id }, data: { status: 'COMPLETED' } });
      return NextResponse.json({ message: 'Marked completed (hash existed)', data: { payoutHash: order.payoutHash } });
    }
    if (order.status !== 'CONFIRMED') {
      return NextResponse.json(
        { message: `Order status must be CONFIRMED to deliver (current: ${order.status})` },
        { status: 400 }
      );
    }

    // 2) Config BUY network (aset yang DIKIRIM)
    const buyCfg = getEvmConfigByName(order.buyNetwork.name);
    if (!buyCfg?.rpc) return NextResponse.json({ message: 'BUY network RPC missing' }, { status: 400 });
    if (!buyCfg?.payoutPk) return NextResponse.json({ message: 'Payout private key missing for BUY network' }, { status: 400 });

    const provider = new JsonRpcProvider(buyCfg.rpc);
    const wallet = new Wallet(buyCfg.payoutPk, provider);
    const from = await wallet.getAddress();

    // 3) Metadata aset yang DIKIRIM (coinToBuy pada buyNetwork)
    const buyOpt = await prisma.paymentOption.findFirst({
      where: { coinId: order.coinToBuyId, networkId: order.buyNetworkId },
      select: { contractAddress: true, decimals: true },
    });

    const isToken = !!buyOpt?.contractAddress;
    let decimals = Number(buyOpt?.decimals || (isToken ? 6 : 18));
    const contractAddr = isToken ? (String(buyOpt!.contractAddress) as `0x${string}`) : undefined;

    // 4) LOCK ringan (hindari double-send)
    const lock = await prisma.order.updateMany({
      where: { id, payoutAt: null, payoutHash: null, status: 'CONFIRMED' },
      data: { payoutAt: new Date() },
    });
    if (lock.count === 0) {
      const fresh = await prisma.order.findUnique({ where: { id }, select: { status: true, payoutHash: true } });
      return NextResponse.json(
        { message: 'Already processing', data: { status: fresh?.status, payoutHash: fresh?.payoutHash ?? null } },
        { status: 200 }
      );
    }

    // 5) Hitung jumlah payout (jumlah yang DIBELI)
    const amountStr = toFixedStr(Number(order.amount), decimals);

    // 6) Kirim payout
    let txHash = '';
    if (!isToken) {
      const value = parseUnits(amountStr, decimals); // native biasanya 18
      const tx = await wallet.sendTransaction({ to: order.receivingAddr, value });
      const rc = await tx.wait(1);
      txHash = tx.hash;
      if (!rc) throw new Error('Native payout tx not confirmed');
    } else {
      const contract = new Contract(contractAddr!, ERC20_ABI, wallet);
      if (!buyOpt?.decimals) {
        // fallback ambil decimals dari kontrak
        decimals = Number(await contract.decimals());
      }
      const value = parseUnits(amountStr, decimals);
      const bal = await contract.balanceOf(from);
      if (bal < value) {
        throw new Error(`Insufficient token balance: have ${bal.toString()}, need ${value.toString()}`);
      }
      const tx = await contract.transfer(order.receivingAddr, value);
      const rc = await tx.wait(1);
      txHash = tx.hash;
      if (!rc) throw new Error('ERC-20 payout tx not confirmed');
    }

    // 7) Simpan hash & tandai selesai
    await prisma.order.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        payoutHash: txHash,
        // payoutAt sudah di-set saat lock; bisa diperbarui ke waktu final jika mau
      },
    });

    // 8) (Opsional) Bersihkan alamat pantauan di webhook PAY network (alamat pembayaran)
    //    Jalankan async tanpa blocking respons
    queueMicrotask(() => {
      try {
        const payCfg = getEvmConfigByName(order.payNetwork.name);
        if (payCfg?.webhookId && process.env.ALCHEMY_NOTIFY_TOKEN) {
          void removeAddressesFromWebhook(payCfg.webhookId, [order.paymentAddr]);
        }
      } catch {
        // diamkan; jangan ganggu flow payout
      }
    });

    return NextResponse.json({
      message: 'Delivered',
      data: { payoutHash: txHash, type: isToken ? 'erc20' : 'native' },
    });
  } catch (e: any) {
    console.error('POST /api/orders/[id]/deliver error:', e);
    return NextResponse.json({ message: e?.message || 'Internal server error' }, { status: 500 });
  }
}
