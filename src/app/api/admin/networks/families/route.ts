import { NextResponse } from "next/server";
import { ChainFamily } from "@prisma/client";

export async function GET() {
  return NextResponse.json(Object.values(ChainFamily));
}
