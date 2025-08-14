import { NextResponse } from "next/server";
import { getApplicationManager } from "@/core";

export async function POST(req: Request) {
  const body = await req.json();
  const app = getApplicationManager();
  try {
    const order = await app.order.service.create(body);
    return NextResponse.json(order, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
