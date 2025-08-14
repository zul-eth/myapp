"use server";
import { revalidatePath } from "next/cache";
import { getApplicationManager } from "@/core";

export async function listNetworks(){ const m=getApplicationManager(); const r=await m.network.service.list(); if(!r.ok) throw r.error; return r.value; }
export async function createNetwork(input:{ id:string; symbol:string; name:string; family:string; isActive:boolean }){
  const m=getApplicationManager(); const r=await m.network.service.create(input); if(!r.ok) throw r.error; revalidatePath("/(admin)/networks"); return r.value;
}
export async function updateNetwork(id:string, input:Partial<{symbol:string;name:string;family:string;isActive:boolean}>){
  const m=getApplicationManager(); const r=await m.network.service.update(id,input); if(!r.ok) throw r.error; revalidatePath("/(admin)/networks"); return r.value;
}
export async function removeNetwork(id:string){
  const m=getApplicationManager(); const r=await m.network.service.remove(id); if(!r.ok) throw r.error; revalidatePath("/(admin)/networks"); return true;
}
