export type PaymentCheckResult =
  | { status: 'NONE'; received: string }
  | { status: 'UNDERPAID'; received: string }
  | { status: 'PENDING_CONF'; received: string; txHash: string; confirmations: number }
  | { status: 'CONFIRMED'; received: string; txHash: string; confirmations: number };

export type EvmTokenMeta = {
  isNative: boolean;                    // true untuk ETH/Base native; false untuk ERC-20
  contractAddress?: `0x${string}`;     // wajib jika isNative = false
  decimals: number;                    // 18 untuk native EVM; token sesuai kontrak (USDT=6)
  minConfirmations: number;            // mis. 3 (testnet)
};
