import 'server-only';
import { PrismaClient } from '@prisma/client';
import type { ResolvedAsset } from './types';

const prisma = new PrismaClient();

export async function resolveAsset(coinId: string, networkId: string): Promise<ResolvedAsset> {
  const cn = await prisma.coinNetwork.findFirst({
    where: { coinId, networkId },
    include: { network: true, coin: true },
  });
  if (!cn) throw new Error('CoinNetwork metadata not found');

  const family = cn.network.family as ResolvedAsset['family'];
  const symbol = cn.symbolOverride ?? cn.coin.symbol;
  const decimals =
    cn.decimals ??
    (family === 'EVM' ? 18 : family === 'SOLANA' ? 9 : 6);

  return {
    family,
    assetType: cn.assetType as ResolvedAsset['assetType'],
    decimals,
    symbol,
    contract: cn.contractAddress ?? undefined,
    memoKind: (cn.memoKind as ResolvedAsset['memoKind']) ?? 'NONE',
    memoLabel: cn.memoLabel ?? undefined,
    memoRegex: cn.memoRegex ?? undefined,
  };
}