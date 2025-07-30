// test-okxwallet.ts
import { EthWallet } from "@okxweb3/coin-ethereum";
import { TrxWallet } from "@okxweb3/coin-tron";
import { SolWallet } from "@okxweb3/coin-solana";

async function testAddresses() {
  const mnemonic = "test test test test test test test test test test test junk";
  const index = 0;

  // Generate ETH
  const ethWallet = new EthWallet();
  const hdPathEth = await ethWallet.getDerivedPath({ index });
  const ethPriv = await ethWallet.getDerivedPrivateKey({ mnemonic, hdPath: hdPathEth });
  const ethAddr = await ethWallet.getNewAddress({ privateKey: ethPriv });
  console.log("✅ ETH Address:", ethAddr.address);

  // Generate TRON
  const tronWallet = new TrxWallet();
  const hdPathTron = await tronWallet.getDerivedPath({ index });
  const tronPriv = await tronWallet.getDerivedPrivateKey({ mnemonic, hdPath: hdPathTron });
  const tronAddr = await tronWallet.getNewAddress({ privateKey: tronPriv });
  console.log("🔵 TRON Address:", tronAddr.address);

  // Generate SOLANA
  const solWallet = new SolWallet();
  const hdPathSol = await solWallet.getDerivedPath({ index });
  const solPriv = await solWallet.getDerivedPrivateKey({ mnemonic, hdPath: hdPathSol });
  const solAddr = await solWallet.getNewAddress({ privateKey: solPriv });
  console.log("🟣 SOL Address:", solAddr.address);
}

testAddresses().catch(console.error);