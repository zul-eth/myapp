"use server";
import { revalidatePath } from "next/cache";
import { getApplicationManager } from "@/core";

export async function listRates(params?: { buyCoinId?:string; buyNetworkId?:string; payCoinId?:string; payNetworkId?:string; limit?:number }) {
  const m=getApplicationManager(); const r=await m.exchangeRate.service.list(params); if(!r.ok) throw r.error; return r.value;
}
export async function upsertRate(input:{ buyCoinId:string; buyNetworkId:string; payCoinId:string; payNetworkId:string; rate:number; asOf?:string }) {
  const m=getApplicationManager(); const r=await m.exchangeRate.service.upsert(input); if(!r.ok) throw r.error;
  revalidatePath("/(admin)/rates"); revalidatePath("/(client)/"); return r.value;
}
export async function getLatestRate(pair:{ buyCoinId:string; buyNetworkId:string; payCoinId:string; payNetworkId:string }) {
  const m=getApplicationManager(); const r=await m.exchangeRate.service.getLatest(pair); if(!r.ok) throw r.error; return r.value;
}
