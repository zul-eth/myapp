'use server';

import 'server-only';

import {
  parseDeriveInput,
  parsePreviewInput,
  parseEvmPayoutInput,
  parseListInput,
} from '@/server/validators/wallets.schema';

import {
  deriveAndStoreAddresses,
  previewDerivedAddress,
} from '@/server/services/wallets/derive.service';

import { sendEvmPayoutService } from '@/server/services/wallets/payout.service';
import { listWalletPools, countWalletPools } from '@/server/repositories/walletPool.repo';

// TODO: ganti dengan guard auth kamu
async function assertAdmin() {
  // const session = await getServerSession(authOptions);
  // if (!session?.user?.roles?.includes('admin')) throw new Error('Unauthorized');
}

export async function deriveWalletsAction(input: unknown) {
  await assertAdmin();
  const { chain, count } = parseDeriveInput(input);
  return deriveAndStoreAddresses({ chain, count });
}

export async function previewDerivedAddressAction(input: unknown) {
  await assertAdmin();
  const { chain, index } = parsePreviewInput(input);
  return previewDerivedAddress({ chain, index });
}

export async function evmPayoutAction(input: unknown) {
  await assertAdmin();
  const { networkName, to, amount, token, confirmations } = parseEvmPayoutInput(input);
  return sendEvmPayoutService({ networkName, to, amount, token, confirmations });
}

export async function listWalletPoolsAction(input?: unknown) {
  await assertAdmin();
  const { chain, take, cursor } = parseListInput(input ?? {});
  const rows = await listWalletPools({ chain, take, cursor: cursor ?? null });
  const total = await countWalletPools({ chain });
  const nextCursor = rows.length ? rows[rows.length - 1].id : null;
  return { rows, total, nextCursor };
}