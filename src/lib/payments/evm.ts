import {
  Interface,
  JsonRpcProvider,
  keccak256,
  toUtf8Bytes,
  parseUnits,
  formatUnits,
} from 'ethers';
import type { EvmTokenMeta, PaymentCheckResult } from './types';

const ERC20_IFACE = new Interface([
  'event Transfer(address indexed from, address indexed to, uint256 value)',
]);
const TRANSFER_TOPIC = keccak256(toUtf8Bytes('Transfer(address,address,uint256)'));

function padTopicAddress(addr: string) {
  return '0x' + addr.toLowerCase().replace(/^0x/, '').padStart(64, '0');
}

/** Cek pembayaran ke paymentAddr. Native=balance, Token=scan Transfer ke paymentAddr. */
export async function checkEvmPayment(args: {
  rpcUrl: string;
  paymentAddr: string;
  expectedAmount: string;    // string decimal sesuai tokenMeta.decimals
  tokenMeta: EvmTokenMeta;
  fromBlock?: number;
}): Promise<PaymentCheckResult> {
  const { rpcUrl, paymentAddr, expectedAmount, tokenMeta, fromBlock } = args;

  const provider = new JsonRpcProvider(rpcUrl);
  let received = 0n;
  let lastTxHash = '';
  let confirmations = 0;

  if (tokenMeta.isNative) {
    const bal = await provider.getBalance(paymentAddr);
    received = bal; // wei
  } else {
    if (!tokenMeta.contractAddress) throw new Error('tokenMeta.contractAddress missing for ERC-20');
    const logs = await provider.getLogs({
      address: tokenMeta.contractAddress,
      topics: [TRANSFER_TOPIC, null, padTopicAddress(paymentAddr)],
      fromBlock: fromBlock ?? 0,
      toBlock: 'latest',
    });
    for (const l of logs) {
      received += BigInt(l.data);
      lastTxHash = l.transactionHash;
      const latest = await provider.getBlockNumber();
      confirmations = l.blockNumber ? latest - l.blockNumber + 1 : 0;
    }
  }

  const exp = parseUnits(expectedAmount, tokenMeta.decimals);

  if (received === 0n) {
    return { status: 'NONE', received: formatUnits(received, tokenMeta.decimals) };
  }
  if (received < exp) {
    return { status: 'UNDERPAID', received: formatUnits(received, tokenMeta.decimals) };
  }

  // Native: begitu saldo >= expected, anggap confirmed (atau set minConfirmations=1 di DB)
  if (tokenMeta.isNative) {
    return {
      status: 'CONFIRMED',
      received: formatUnits(received, tokenMeta.decimals),
      txHash: lastTxHash || '',
      confirmations: tokenMeta.minConfirmations,
    };
  }

  // Token: wajib tunggu konfirmasi riil
  if (confirmations < tokenMeta.minConfirmations) {
    return {
      status: 'PENDING_CONF',
      received: formatUnits(received, tokenMeta.decimals),
      txHash: lastTxHash,
      confirmations,
    };
  }

  return {
    status: 'CONFIRMED',
    received: formatUnits(received, tokenMeta.decimals),
    txHash: lastTxHash,
    confirmations,
  };
}
