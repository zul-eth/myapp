"use server";
import { getApplicationManager } from "@/core";
export async function deriveAddress(chain:string){ const m=getApplicationManager(); const r=await m.wallet.service.derive(chain); if(!r.ok) throw r.error; return r.value; }
export async function payout(params: { to:string; amount:number; chain:string }){ const m=getApplicationManager(); const r=await m.wallet.service.payout(params); if(!r.ok) throw r.error; return r.value; }
