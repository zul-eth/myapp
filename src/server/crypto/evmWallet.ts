import 'server-only';
import { getEvmConfigByName } from '@/lib/payments/networkMap';

export function getEvmPayoutCredentials(networkName: string) {
  const cfg = getEvmConfigByName(networkName);
  if (!cfg) throw new Error(`Network ${networkName} tidak dikenal`);
  if (!cfg.rpc) throw new Error(`RPC untuk ${networkName} belum diset`);
  if (!cfg.payoutPk) throw new Error(`Private key payout untuk ${networkName} belum diset`);
  return { rpcUrl: cfg.rpc, privateKey: cfg.payoutPk as `0x${string}` };
}