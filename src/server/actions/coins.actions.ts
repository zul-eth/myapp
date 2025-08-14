"use server";
import { revalidatePath } from "next/cache";
import { getApplicationManager } from "@/core";

export async function listCoins() {
  const m = getApplicationManager(); const r = await m.coin.service.list(); if (!r.ok) throw r.error; return r.value;
}
export async function createCoin(input: { id:string; symbol:string; name:string; logoUrl?:string|null; isActive:boolean }) {
  const m = getApplicationManager(); const r = await m.coin.service.create(input); if (!r.ok) throw r.error;
  revalidatePath("/(admin)/coins"); return r.value;
}
export async function updateCoin(id: string, input: Partial<{ symbol:string; name:string; logoUrl?:string|null; isActive:boolean }>) {
  const m = getApplicationManager(); const r = await m.coin.service.update(id, input); if (!r.ok) throw r.error;
  revalidatePath("/(admin)/coins"); return r.value;
}
export async function removeCoin(id: string) {
  const m = getApplicationManager(); const r = await m.coin.service.remove(id); if (!r.ok) throw r.error;
  revalidatePath("/(admin)/coins"); return true;
}
