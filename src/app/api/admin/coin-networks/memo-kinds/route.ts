import { NextResponse } from "next/server";
import { MemoKind } from "@prisma/client";

export async function GET() {
  return NextResponse.json(Object.values(MemoKind));
}
