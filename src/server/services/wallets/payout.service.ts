'use server';

import 'server-only';
import { sendEvmPayout } from '@/lib/payments/evmPayout';
import { getEvmPayoutCredentials } from '@/server/crypto/evmWallet';

export async function sendEvmPayoutService(params: {
  networkName: string;
  to: `0x${string}`;
  amount: string;
  token?: { contract?: `0x${string}`; decimals?: number };
  confirmations?: number;
}) {
  const { networkName, to, amount, token, confirmations } = params;
  const { rpcUrl, privateKey } = getEvmPayoutCredentials(networkName);
  const isToken = Boolean(token?.contract);

  return sendEvmPayout({
    rpcUrl,
    privateKey,
    to,
    amount,
    isToken,
    token,
    confirmations,
  });
}
