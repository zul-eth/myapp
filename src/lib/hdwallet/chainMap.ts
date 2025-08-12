// src/lib/hdwallet/chainMap.ts

// Nilai yang mungkin tersimpan di DB (termasuk alias umum)
export type DbChain =
  | 'evm' | 'eth'
  | 'tron' | 'trx'
  | 'solana' | 'sol'
  | 'ltc' | 'litecoin'
  | 'doge' | 'dogecoin'
  | 'eos' | 'wax'
  | 'sui'
  | 'ton' | 'the-open-network';

// Target runtime yang dipakai di generateAddress (UniversalChain)
export type RuntimeChain =
  | 'ltc'
  | 'doge'
  | 'evm'
  | 'eos'
  | 'sui'
  | 'tron'
  | 'solana'
  | 'ton';

export function dbToRuntimeChain(dbChain: DbChain): RuntimeChain {
  switch (dbChain) {
    case 'eth': return 'evm';
    case 'trx': return 'tron';
    case 'sol': return 'solana';
    case 'litecoin': return 'ltc';
    case 'dogecoin': return 'doge';
    case 'wax': return 'eos';
    case 'the-open-network': return 'ton';

    // sudah sesuai dengan target
    case 'evm':
    case 'tron':
    case 'solana':
    case 'ltc':
    case 'doge':
    case 'eos':
    case 'sui':
    case 'ton':
      return dbChain;

    default:
      // fallback (seharusnya tidak terjadi jika tipe DbChain dijaga)
      return dbChain as RuntimeChain;
  }
}
