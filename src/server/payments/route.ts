import 'server-only';
import { resolveAsset } from './resolveAsset';
import { validateMemo } from './memo';
import type { PayoutRequest } from './types';
import { sendEvmPayout } from '@/lib/payments/evmPayout';
import { getEvmCredsByNetworkId } from './evmCreds';

export async function sendPayout(req: PayoutRequest) {
  const asset = await resolveAsset(req.coinId, req.networkId);

  // Validasi memo untuk chain yang butuh
  const v = validateMemo(asset.memoKind, req.memo);
  if (!v.ok) throw new Error(asset.memoLabel ? `${asset.memoLabel}: ${v.reason}` : v.reason);

  switch (asset.family) {
    case 'EVM': {
      const isToken = asset.assetType === 'EVM_ERC20' && !!asset.contract;
      const { rpcUrl, privateKey } = await getEvmCredsByNetworkId(req.networkId);

      return sendEvmPayout({
        rpcUrl,
        privateKey,
        to: req.to as `0x${string}`,
        amount: req.amount,
        isToken,
        token: isToken ? { contract: asset.contract as `0x${string}`, decimals: asset.decimals } : undefined,
        confirmations: 1,
      });
    }

    // Non‑EVM saat ini native only → implementasi disiapkan kemudian
    case 'TRON':
    case 'SOLANA':
    case 'EOS':
    case 'XRP':
    case 'DOGE':
    case 'SUI':
    case 'LTC':
    case 'TON': {
      // Di sini nanti panggil driver chain masing‑masing (native only).
      // Gunakan v.value (memo) jika diperlukan (XRP/EOS/TON).
      throw new Error(`${asset.family} payout belum diimplementasikan`);
    }
  }
}