"use server";
import { revalidatePath } from "next/cache";
import { getApplicationManager } from "@/core";

export async function listOrders(){ const m=getApplicationManager(); const r=await m.order.service.list(); if(!r.ok) throw r.error; return r.value; }
export async function createOrder(input:any){ const m=getApplicationManager(); const r=await m.order.service.create(input); if(!r.ok) throw r.error; revalidatePath("/(admin)/orders"); return r.value; }
export async function updateOrder(id:string, input:any){ const m=getApplicationManager(); const r=await m.order.service.update(id,input); if(!r.ok) throw r.error; revalidatePath("/(admin)/orders"); return r.value; }
export async function deliverOrder(id:string){ const m=getApplicationManager(); const r=await m.order.service.deliver(id); if(!r.ok) throw r.error; revalidatePath("/(admin)/orders"); return r.value; }
