"use server";
import { getApplicationManager } from "@/core";
export async function deriveAddressAction(chain: string){
  const m = getApplicationManager();
  const r = await m.wallet.service.derive(chain);
  if (!r.ok) throw r.error;
  return r.value;
}
export async function payoutAction(params: { to: string; amount: number; chain: string }){
  const m = getApplicationManager();
  const r = await m.wallet.service.payout(params);
  if (!r.ok) throw r.error;
  return r.value;
}
