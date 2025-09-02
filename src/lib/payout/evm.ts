import { ethers } from "ethers";

export type EvmSignerConfig = {
  rpcUrl: string;
  privateKey: string;
};

export function getEvmWallet(cfg: EvmSignerConfig) {
  if (!cfg.rpcUrl) throw new Error("rpcUrl wajib");
  if (!cfg.privateKey) throw new Error("privateKey wajib");
  const provider = new ethers.JsonRpcProvider(cfg.rpcUrl);
  return new ethers.Wallet(cfg.privateKey, provider);
}

export async function sendNative(opts: {
  rpcUrl: string;
  privateKey: string;
  to: string;
  amountHuman: string; // mis. "0.05" ETH
  gasPriceGwei?: string;
  gasLimit?: bigint;
}) {
  const wallet = getEvmWallet({ rpcUrl: opts.rpcUrl, privateKey: opts.privateKey });

  const value = ethers.parseUnits(opts.amountHuman, 18); // ETH decimals
  const to = ethers.getAddress(opts.to);

  const gasPrice =
    opts.gasPriceGwei ? ethers.parseUnits(opts.gasPriceGwei, "gwei") : await wallet.provider.getGasPrice();

  const txReq: ethers.TransactionRequest = {
    to,
    value,
    gasPrice,
    gasLimit: opts.gasLimit ?? undefined,
  };

  const bal = await wallet.getBalance();
  const estGas = txReq.gasLimit ?? (await wallet.estimateGas(txReq));
  const need = value + estGas * gasPrice;
  if (bal < need) {
    throw new Error(
      `Saldo tidak cukup. Balance=${ethers.formatEther(bal)} ETH, butuh ~${ethers.formatEther(need)} ETH (value+gas)`
    );
  }

  const tx = await wallet.sendTransaction(txReq);
  return tx.hash;
}

const ERC20_ABI = [
  "function decimals() view returns (uint8)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

export async function sendErc20(opts: {
  rpcUrl: string;
  privateKey: string;
  token: string;
  to: string;
  amountHuman: string; // sesuai decimals token
  decimals?: number;
  gasPriceGwei?: string;
}) {
  const wallet = getEvmWallet({ rpcUrl: opts.rpcUrl, privateKey: opts.privateKey });
  const token = ethers.getAddress(opts.token);
  const to = ethers.getAddress(opts.to);

  const erc20 = new ethers.Contract(token, ERC20_ABI, wallet);
  const decimals = typeof opts.decimals === "number" ? opts.decimals : Number(await erc20.decimals());

  const amount = ethers.parseUnits(opts.amountHuman, decimals);
  const gasPrice =
    opts.gasPriceGwei ? ethers.parseUnits(opts.gasPriceGwei, "gwei") : await wallet.provider.getGasPrice();

  const gasLimit: bigint = await erc20.transfer.estimateGas(to, amount);
  const tx = await erc20.transfer(to, amount, { gasPrice, gasLimit });
  return tx.hash;
}
