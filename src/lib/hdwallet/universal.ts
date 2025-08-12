// src/lib/hdwallet/universal.ts
import 'server-only';

export type UniversalChain =
  | 'ltc'
  | 'doge'
  | 'evm'
  | 'eos'
  | 'sui'
  | 'tron'
  | 'solana'
  | 'ton';

export type AddressTypeUTXO = 'p2pkh' | 'p2sh-p2wpkh' | 'p2wpkh';

const COIN_TYPE_SLIP44 = {
  ltc: 2,  // Litecoin
  doge: 3, // Dogecoin
} as const;

function purposeFor(addrType: AddressTypeUTXO): number {
  // BIP44 (44) = legacy P2PKH, BIP49 (49) = P2SH-P2WPKH, BIP84 (84) = native segwit P2WPKH
  switch (addrType) {
    case 'p2pkh': return 44;
    case 'p2sh-p2wpkh': return 49;
    case 'p2wpkh': return 84;
    default: return 44;
  }
}

function hdPathBip(purpose: number, coinType: number, index: number) {
  // m / purpose' / coin_type' / account' / change / index
  return `m/${purpose}'/${coinType}'/0'/0/${index}`;
}

/**
 * Generate address untuk beragam chain.
 * - LTC/DOGE via BtcWallet (pilih jenis address P2PKH/P2WPKH/P2SH-P2WPKH).
 * - EVM/TRON/SOLANA/EOS/SUI/TON sesuai pola OKX SDK.
 */
export async function generateAddress(
  chain: UniversalChain,
  mnemonic: string,
  index: number,
  opts?: { addressType?: AddressTypeUTXO } // hanya dipakai untuk ltc/doge
): Promise<string> {
  // helper import yg tahan bundler: coba dynamic import; kalau gagal, fallback ke createRequire
  async function load<T = any>(specifier: string): Promise<T> {
    try {
      // coba dynamic import biasa
      // @ts-ignore
      return await import(specifier);
    } catch {
      // fallback: Node-style require di runtime server
      const { createRequire } = await import('module');
      const req = createRequire(import.meta.url);
      return req(specifier);
    }
  }

  switch (chain) {
    case 'ltc':
    case 'doge': {
      const mod = await load<any>('@okxweb3/coin-bitcoin');
      const wallet = new mod.BtcWallet();
      const addrType = opts?.addressType ?? 'p2pkh';
      const purpose = purposeFor(addrType);
      const coinType = COIN_TYPE_SLIP44[chain]; // 2=ltc, 3=doge
      const hdPath = hdPathBip(purpose, coinType, index);
      const privateKey = await wallet.getDerivedPrivateKey({ mnemonic, hdPath });

      try {
        const { address } = await (wallet as any).getNewAddress({
          privateKey,
          // beberapa versi SDK pakai "symbol", sebagian "network"
          symbol: chain.toUpperCase(),     // 'LTC' | 'DOGE'
          addressType: addrType,           // 'p2pkh' | 'p2sh-p2wpkh' | 'p2wpkh'
        });
        return address;
      } catch {
        const { address } = await wallet.getNewAddress({ privateKey } as any);
        return address;
      }
    }

    case 'evm': {
      const mod = await load<any>('@okxweb3/coin-ethereum');
      const wallet = new mod.EthWallet();
      const hdPath = await wallet.getDerivedPath?.({ index }) ?? `m/44'/60'/0'/0/${index}`;
      const privateKey = await wallet.getDerivedPrivateKey({ mnemonic, hdPath });
      const { address } = await wallet.getNewAddress({ privateKey });
      return address;
    }

    case 'tron': {
      const mod = await load<any>('@okxweb3/coin-tron');
      const wallet = new mod.TrxWallet();
      const hdPath = await wallet.getDerivedPath?.({ index }) ?? `m/44'/195'/0'/0/${index}`;
      const privateKey = await wallet.getDerivedPrivateKey({ mnemonic, hdPath });
      const { address } = await wallet.getNewAddress({ privateKey });
      return address;
    }

    case 'solana': {
      const mod = await load<any>('@okxweb3/coin-solana');
      const wallet = new mod.SolWallet();
      const hdPath = await wallet.getDerivedPath?.({ index }) ?? `m/44'/501'/0'/0'`;
      const privateKey = await wallet.getDerivedPrivateKey({ mnemonic, hdPath });
      const { address } = await wallet.getNewAddress({ privateKey });
      return address;
    }

    case 'eos': {
      const mod = await load<any>('@okxweb3/coin-eos');
      const wallet = new mod.WaxWallet();
      const hdPath = await wallet.getDerivedPath?.({ index }) ?? `m/44'/194'/0'/0/${index}`;
      const privateKey = await wallet.getDerivedPrivateKey?.({ mnemonic, hdPath });
      const { address } = await wallet.getNewAddress?.({ privateKey });
      if (!address) throw new Error('EOS address derivation not supported by current SDK version');
      return address;
    }

    case 'sui': {
      const mod = await load<any>('@okxweb3/coin-sui');
      const wallet = new mod.SuiWallet();
      const hdPath = await wallet.getDerivedPath?.({ index }) ?? `m/44'/784'/0'/0'/${index}'`;
      const privateKey = await wallet.getDerivedPrivateKey({ mnemonic, hdPath });
      const { address } = await wallet.getNewAddress({ privateKey });
      return address;
    }

    case 'ton': {
      const mod = await load<any>('@okxweb3/coin-ton');
      const wallet = new mod.TonWallet();
      const hdPath = await wallet.getDerivedPath?.({ index }) ?? `m/44'/607'/0'/0/${index}`;
      const privateKey = await wallet.getDerivedPrivateKey?.({ mnemonic, hdPath });
      const { address } = await wallet.getNewAddress?.({ privateKey });
      if (!address) throw new Error('TON address derivation not supported by current SDK version');
      return address;
    }

    default:
      throw new Error(`Unsupported chain: ${chain}`);
  }
}
