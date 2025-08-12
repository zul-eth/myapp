// src/lib/payments/networkMap.ts

export const EVM_NETWORKS = {
  'ETH SEPOLIA': {
    rpc: process.env.RPC_ETH_SEPOLIA || '',
    webhookId: process.env.ALCHEMY_WEBHOOK_ID_ETH_SEPOLIA || '',
    payoutPk: process.env.ETH_SEPOLIA_PRIVATE_KEY || '',
  },
  'BASE SEPOLIA': {
    rpc: process.env.RPC_BASE_SEPOLIA || '',
    webhookId: process.env.ALCHEMY_WEBHOOK_ID_BASE_SEPOLIA || '',
    payoutPk: process.env.BASE_SEPOLIA_PRIVATE_KEY || '',
  },
  'ARB SEPOLIA': {
    rpc: process.env.RPC_ARB_SEPOLIA || '',
    webhookId: process.env.ALCHEMY_WEBHOOK_ID_ARB_SEPOLIA || '',
    payoutPk: process.env.ARB_SEPOLIA_PRIVATE_KEY || '',
  },
} as const;

const ALIASES: Record<string, keyof typeof EVM_NETWORKS> = {
  'ETH SEPOLIA': 'ETH SEPOLIA',
  'BASE SEPOLIA': 'BASE SEPOLIA',
  'ARB SEPOLIA': 'ARB SEPOLIA',
};

export function getEvmConfigByName(name: string) {
  const key = ALIASES[name.trim().toUpperCase()];
  return key ? (EVM_NETWORKS as any)[key] : undefined;
}
