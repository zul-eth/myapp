import 'server-only';

type Chain = 'evm' | 'tron' | 'solana';

export type DeriveInputT = { chain: Chain; count: number };
export type PreviewInputT = { chain: Chain; index: number };
export type EvmPayoutInputT = {
  networkName: string;
  to: `0x${string}`;
  amount: string;
  token?: { contract?: `0x${string}`; decimals?: number };
  confirmations?: number;
};
export type ListInputT = { chain?: Chain; take?: number; cursor?: string | null };

function isChain(x: any): x is Chain {
  return x === 'evm' || x === 'tron' || x === 'solana';
}
function isHexAddr(x: any): x is `0x${string}` {
  return typeof x === 'string' && /^0x[a-fA-F0-9]{40}$/.test(x);
}
function asInt(n: any) {
  const v = Number(n);
  return Number.isInteger(v) ? v : NaN;
}

export function parseDeriveInput(input: any): DeriveInputT {
  const chain = input?.chain;
  const count = input?.count ?? 1;
  if (!isChain(chain)) throw new Error('chain harus evm|tron|solana');
  const c = asInt(count);
  if (!(c >= 1 && c <= 100)) throw new Error('count harus 1..100');
  return { chain, count: c };
}

export function parsePreviewInput(input: any): PreviewInputT {
  const chain = input?.chain;
  const index = input?.index;
  if (!isChain(chain)) throw new Error('chain harus evm|tron|solana');
  const i = asInt(index);
  if (!(i >= 0)) throw new Error('index harus >= 0');
  return { chain, index: i };
}

export function parseEvmPayoutInput(input: any): EvmPayoutInputT {
  const networkName = String(input?.networkName ?? '');
  const to = input?.to;
  const amount = String(input?.amount ?? '');
  const token = input?.token;
  const confirmations = input?.confirmations;

  if (!networkName) throw new Error('networkName wajib');
  if (!isHexAddr(to)) throw new Error('to harus alamat 0x…40 hex');
  if (!/^\d+(\.\d+)?$/.test(amount)) throw new Error('amount harus angka desimal');

  let tokenOut: EvmPayoutInputT['token'] | undefined = undefined;
  if (token) {
    if (token.contract && !isHexAddr(token.contract)) throw new Error('token.contract harus alamat 0x…40 hex');
    if (token.decimals !== undefined) {
      const d = asInt(token.decimals);
      if (!(d >= 0 && d <= 36)) throw new Error('token.decimals 0..36');
      tokenOut = { contract: token.contract as any, decimals: d };
    } else {
      tokenOut = { contract: token.contract as any };
    }
  }

  let confOut: number | undefined = undefined;
  if (confirmations !== undefined) {
    const c = asInt(confirmations);
    if (!(c >= 0 && c <= 10)) throw new Error('confirmations 0..10');
    confOut = c;
  }

  return { networkName, to, amount, token: tokenOut, confirmations: confOut };
}

export function parseListInput(input: any): ListInputT {
  const chain = input?.chain;
  if (chain !== undefined && !isChain(chain)) throw new Error('chain harus evm|tron|solana');
  const take = input?.take === undefined ? undefined : asInt(input.take);
  if (take !== undefined && !(take >= 1 && take <= 200)) throw new Error('take 1..200');
  const cursor = input?.cursor ?? null;
  if (cursor !== null && typeof cursor !== 'string') throw new Error('cursor harus string/null');
  return { chain, take, cursor };
}