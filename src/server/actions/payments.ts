"use server";
import { getApplicationManager } from "@/core";
export async function deliverOrderAction(id: string){
  const m = getApplicationManager();
  const r = await m.order.service.deliver(id);
  if (!r.ok) throw r.error;
  return r.value;
}
