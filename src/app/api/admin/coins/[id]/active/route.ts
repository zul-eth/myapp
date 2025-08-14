import { NextResponse } from "next/server";
import { getApplicationManager } from "@/core";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { isActive } = await req.json();
  const app = getApplicationManager();
  const updated = await app.coin.service.toggleActive(id, isActive);
  return NextResponse.json(updated);
}
