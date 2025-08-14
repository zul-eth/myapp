import { NextResponse } from "next/server";
import { AssetType } from "@prisma/client";

export async function GET() {
  return NextResponse.json(Object.values(AssetType));
}
