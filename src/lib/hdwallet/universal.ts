// src/lib/hdwallet/universal.ts
import { EthWallet } from "@okxweb3/coin-ethereum";
import { TrxWallet } from "@okxweb3/coin-tron";
import { SolWallet } from "@okxweb3/coin-solana";

export async function generateAddress(
  chain: "eth" | "tron" | "solana",
  mnemonic: string,
  index: number
): Promise<string> {
  switch (chain) {
    case "eth": {
      const wallet = new EthWallet();
      const hdPath = await wallet.getDerivedPath({ index });
      const privKey = await wallet.getDerivedPrivateKey({ mnemonic, hdPath });
      const { address } = await wallet.getNewAddress({ privateKey: privKey });
      return address;
    }
    case "tron": {
      const wallet = new TrxWallet();
      const hdPath = await wallet.getDerivedPath({ index });
      const privKey = await wallet.getDerivedPrivateKey({ mnemonic, hdPath });
      const { address } = await wallet.getNewAddress({ privateKey: privKey });
      return address;
    }
    case "solana": {
      const wallet = new SolWallet();
      const hdPath = await wallet.getDerivedPath({ index });
      const privKey = await wallet.getDerivedPrivateKey({ mnemonic, hdPath });
      const { address } = await wallet.getNewAddress({ privateKey: privKey });
      return address;
    }
    default:
      throw new Error("Unsupported chain");
  }
}