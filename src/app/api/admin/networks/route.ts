import { getApplicationManager } from "@/core";
import { NextResponse } from "next/server";

export async function GET() {
  const app = getApplicationManager();
  const list = await app.network.service.list();
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  const app = getApplicationManager();
  const data = await req.json();
  const created = await app.network.service.create(data);
  return NextResponse.json(created, { status: 201 });
}
