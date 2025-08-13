import 'server-only';
import { PrismaClient } from '@prisma/client';
import { getEvmConfigByName } from '@/lib/payments/networkMap';

const prisma = new PrismaClient();

/** Map networkId -> (rpcUrl, payoutPk) via network.name dan networkMap.ts */
export async function getEvmCredsByNetworkId(networkId: string) {
  const net = await prisma.network.findUnique({ where: { id: networkId } });
  if (!net) throw new Error('Network not found');
  const cfg = getEvmConfigByName(net.name);
  if (!cfg?.rpc || !cfg?.payoutPk) throw new Error(`Missing EVM creds for ${net.name}`);
  return { rpcUrl: cfg.rpc, privateKey: cfg.payoutPk as `0x${string}` };
}