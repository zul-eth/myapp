import { NextResponse } from "next/server";
import { getApplicationManager } from "@/core";

export async function GET() {
  const app = getApplicationManager();
  const coins = await app.coin.service.listActive();
  return NextResponse.json(coins);
}
