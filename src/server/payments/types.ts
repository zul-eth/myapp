import 'server-only';

export type ChainFamily = 'EVM'|'TRON'|'SOLANA'|'EOS'|'XRP'|'DOGE'|'SUI'|'LTC'|'TON';
export type AssetType  = 'NATIVE'|'EVM_ERC20'|'OTHER';
export type MemoKind   = 'NONE'|'XRP_TAG'|'EOS_TEXT'|'TON_TEXT'|'OTHER';

export type ResolvedAsset = {
  family: ChainFamily;
  assetType: AssetType;
  decimals: number;
  symbol: string;
  contract?: string;
  memoKind: MemoKind;
  memoLabel?: string;
  memoRegex?: string;
};

export type PayoutRequest = {
  networkId: string;
  coinId: string;
  to: string;
  amount: string;
  memo?: string | number;
};