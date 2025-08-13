// src/app/api/orders/[id]/deliver/route.ts
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, ChainFamily } from '@prisma/client';
import { JsonRpcProvider, Wallet, Contract, parseUnits } from 'ethers';
import { getEvmConfigByName } from '@/lib/payments/networkMap';
import { removeAddressesFromWebhook } from '@/lib/payments/notify';

const prisma = new PrismaClient();

const ERC20_ABI = [
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
];

type Params<T> = { params: Promise<T> };

function toFixedStr(n: number, decimals: number) {
  return (Math.round(n * 10 ** decimals) / 10 ** decimals).toFixed(decimals);
}

export async function POST(_req: NextRequest, { params }: Params<{ id: string }>) {
  try {
    const { id } = await params;

    // 1) Ambil order + relasi yang diperlukan
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        coinToBuy: true,
        buyNetwork: true,
        payWith: true,
        payNetwork: true,
      },
    });
    if (!order) return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    if (!order.receivingAddr) {
      return NextResponse.json({ message: 'Receiving address missing' }, { status: 400 });
    }

    // Idempotent guard
    if (order.status === 'COMPLETED') {
      return NextResponse.json({
        message: 'Already completed',
        data: { payoutHash: order.payoutHash ?? null },
      });
    }
    if (order.payoutHash) {
      await prisma.order.update({ where: { id }, data: { status: 'COMPLETED' } });
      return NextResponse.json({
        message: 'Marked completed (hash existed)',
        data: { payoutHash: order.payoutHash },
      });
    }
    if (order.status !== 'CONFIRMED') {
      return NextResponse.json(
        { message: `Order status must be CONFIRMED to deliver (current: ${order.status})` },
        { status: 400 },
      );
    }

    // 2) Metadata aset yang DIKIRIM (coinToBuy pada buyNetwork)
    const cn = await prisma.coinNetwork.findFirst({
      where: { coinId: order.coinToBuyId, networkId: order.buyNetworkId },
      select: {
        assetType: true,
        contractAddress: true,
        decimals: true,
        memoKind: true,
        memoLabel: true,
        network: { select: { family: true, name: true } },
      },
    });
    if (!cn) return NextResponse.json({ message: 'CoinNetwork metadata not found' }, { status: 400 });

    // 3) Validasi memo/tag bila diperlukan
    if (cn.memoKind && cn.memoKind !== 'NONE') {
      const memo = order.receivingMemo ?? null;
      if (!memo || `${memo}`.length === 0) {
        return NextResponse.json(
          { message: `${cn.memoLabel ?? 'Memo/Tag'} diperlukan untuk network ini` },
          { status: 400 },
        );
      }
    }

    // 4) Router berdasarkan Network.family
    switch (cn.network.family) {
      case ChainFamily.EVM: {
        // ---- EVM payout (native & ERC-20) ----
        const buyCfg = getEvmConfigByName(cn.network.name);
        if (!buyCfg?.rpc) {
          return NextResponse.json({ message: 'BUY network RPC missing' }, { status: 400 });
        }
        if (!buyCfg?.payoutPk) {
          return NextResponse.json({ message: 'Payout private key missing for BUY network' }, { status: 400 });
        }

        const provider = new JsonRpcProvider(buyCfg.rpc);
        const wallet = new Wallet(buyCfg.payoutPk, provider);
        const from = await wallet.getAddress();

        const isToken = cn.assetType === 'EVM_ERC20' && !!cn.contractAddress;
        let decimals = Number(cn.decimals ?? (isToken ? 6 : 18));
        const contractAddr = isToken ? (String(cn.contractAddress) as `0x${string}`) : undefined;

        // 5) LOCK ringan (hindari double-send)
        const lock = await prisma.order.updateMany({
          where: { id, payoutAt: null, payoutHash: null, status: 'CONFIRMED' },
          data: { payoutAt: new Date() },
        });
        if (lock.count === 0) {
          const fresh = await prisma.order.findUnique({
            where: { id },
            select: { status: true, payoutHash: true },
          });
          return NextResponse.json(
            {
              message: 'Already processing',
              data: { status: fresh?.status, payoutHash: fresh?.payoutHash ?? null },
            },
            { status: 200 },
          );
        }

        // 6) Hitung jumlah payout
        const amountStr = toFixedStr(Number(order.amount), decimals);

        // 7) Kirim payout
        let txHash = '';
        if (!isToken) {
          const value = parseUnits(amountStr, decimals);
          const tx = await wallet.sendTransaction({ to: order.receivingAddr, value });
          const rc = await tx.wait(1);
          txHash = tx.hash;
          if (!rc) throw new Error('Native payout tx not confirmed');
        } else {
          const contract = new Contract(contractAddr!, ERC20_ABI, wallet);
          if (!cn.decimals) decimals = Number(await contract.decimals());
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

        // 8) Simpan hash & tandai selesai
        await prisma.order.update({
          where: { id },
          data: { status: 'COMPLETED', payoutHash: txHash },
        });

        // 9) CABUT alamat pantauan di PAY network (sinkron dengan notify terbaru: PATCH)
        //    Hanya jika webhook aktif & token tersedia; non-blocking.
        queueMicrotask(() => {
          try {
            const payCfg = getEvmConfigByName(order.payNetwork.name);
            const enabled = process.env.ALCHEMY_WEBHOOK_ENABLED === 'true';
            if (enabled && payCfg?.webhookId && process.env.ALCHEMY_NOTIFY_TOKEN && order.paymentAddr) {
              void removeAddressesFromWebhook(payCfg.webhookId, [order.paymentAddr]);
            }
          } catch {
            // jangan ganggu flow payout
          }
        });

        return NextResponse.json({
          message: 'Delivered',
          data: { payoutHash: txHash, type: isToken ? 'erc20' : 'native' },
        });
      }

      // Non‑EVM: belum diimplementasikan
      default: {
        return NextResponse.json(
          { message: `${cn.network.family} payout belum diimplementasikan` },
          { status: 400 },
        );
      }
    }
  } catch (e: any) {
    console.error('POST /api/orders/[id]/deliver error:', e);
    return NextResponse.json({ message: e?.message || 'Internal server error' }, { status: 500 });
  }
}
