'use server';
import 'server-only';
import { sendPayout } from '@/server/payments/router';

export async function payoutAction(input: {
  networkId: string;
  coinId: string;
  to: string;
  amount: string;
  memo?: string | number;
}) {
  // TODO: assert admin
  if (!input.networkId || !input.coinId || !input.to || !input.amount) {
    throw new Error('networkId, coinId, to, amount wajib diisi');
  }
  return sendPayout(input);
}