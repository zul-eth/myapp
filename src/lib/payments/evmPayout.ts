// src/lib/payments/evmPayout.ts
import { JsonRpcProvider, Wallet, Contract, parseUnits } from 'ethers';

const ERC20_ABI = [
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
];

export type PayoutArgs = {
  rpcUrl: string;
  privateKey: string;               // pk yang sesuai network BUY (bukan PAY)
  to: string;                       // receivingAddr (alamat klien)
  amount: string;                   // jumlah dalam satuan desimal (mis. "1.23")
  isToken: boolean;
  token?: { contract: `0x${string}`; decimals?: number };
  confirmations?: number;           // default 1
};

export async function sendEvmPayout({
  rpcUrl, privateKey, to, amount, isToken, token, confirmations = 1,
}: PayoutArgs) {
  if (!rpcUrl) throw new Error('rpcUrl missing');
  if (!privateKey) throw new Error('privateKey missing');
  if (!to) throw new Error('to missing');
  if (!amount) throw new Error('amount missing');

  const provider = new JsonRpcProvider(rpcUrl);
  const wallet = new Wallet(privateKey, provider);
  const from = await wallet.getAddress();

  if (!isToken) {
    const value = parseUnits(amount, 18);
    const tx = await wallet.sendTransaction({ to, value });
    const rc = await tx.wait(confirmations);
    return { hash: tx.hash, blockNumber: rc?.blockNumber ?? null, type: 'native' as const };
  }

  // token
  if (!token?.contract) throw new Error('token.contract missing for ERC-20 payout');

  const contract = new Contract(token.contract, ERC20_ABI, wallet);
  const decimals: number = token?.decimals ?? (await contract.decimals()).valueOf();
  const value = parseUnits(amount, decimals);

  // sanity balance check (opsional)
  const bal = await contract.balanceOf(from);
  if (bal < value) throw new Error('insufficient token balance for payout');

  const tx = await contract.transfer(to, value);
  const rc = await tx.wait(confirmations);
  return { hash: tx.hash, blockNumber: rc?.blockNumber ?? null, type: 'erc20' as const, decimals };
}
