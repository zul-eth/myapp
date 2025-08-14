"use server";
import { revalidatePath } from "next/cache";
import { getApplicationManager } from "@/core";

export async function listCoinNetworks(){ const m=getApplicationManager(); const r=await m.coinNetwork.service.list(); if(!r.ok) throw r.error; return r.value; }
export async function createCoinNetwork(input:{ id?:string; coinId:string; networkId:string }){
  const m=getApplicationManager(); const r=await m.coinNetwork.service.create(input); if(!r.ok) throw r.error; revalidatePath("/(admin)/coin-network"); return r.value;
}
export async function updateCoinNetwork(id:string, input:Partial<{coinId:string; networkId:string}>){
  const m=getApplicationManager(); const r=await m.coinNetwork.service.update(id,input); if(!r.ok) throw r.error; revalidatePath("/(admin)/coin-network"); return r.value;
}
export async function removeCoinNetwork(id:string){
  const m=getApplicationManager(); const r=await m.coinNetwork.service.remove(id); if(!r.ok) throw r.error; revalidatePath("/(admin)/coin-network"); return true;
}
