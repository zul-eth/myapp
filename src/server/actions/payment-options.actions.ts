"use server";
import { revalidatePath } from "next/cache";
import { getApplicationManager } from "@/core";

export async function listPaymentOptions(){ const m=getApplicationManager(); const r=await m.paymentOption.service.list(); if(!r.ok) throw r.error; return r.value; }
export async function createPaymentOption(input:{ id?:string; coinId:string; networkId:string; isActive:boolean }){
  const m=getApplicationManager(); const r=await m.paymentOption.service.create(input); if(!r.ok) throw r.error; revalidatePath("/(admin)/payment-options"); return r.value;
}
export async function updatePaymentOption(id:string, input:Partial<{ coinId:string; networkId:string; isActive:boolean }>) {
  const m=getApplicationManager(); const r=await m.paymentOption.service.update(id,input); if(!r.ok) throw r.error; revalidatePath("/(admin)/payment-options"); return r.value;
}
export async function removePaymentOption(id:string){
  const m=getApplicationManager(); const r=await m.paymentOption.service.remove(id); if(!r.ok) throw r.error; revalidatePath("/(admin)/payment-options"); return true;
}
