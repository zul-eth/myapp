// 📄 File: src/app/api/coin-network/route.ts

import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// GET all coin-network relations
export async function GET() {
  try {
    const relations = await prisma.coinNetwork.findMany({
      include: {
        coin: true,
        network: true,
      },
    });

    return NextResponse.json(relations);
  } catch (error) {
    console.error("GET /api/coin-network error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// POST new coin-network relation
export async function POST(req: NextRequest) {
  try {
    const { coinId, networkId } = await req.json();

    if (!coinId || !networkId) {
      return NextResponse.json({ message: "coinId and networkId are required" }, { status: 400 });
    }
    
    const existing = await prisma.coinNetwork.findUnique({
      where: {
        coinId_networkId: { coinId, networkId }
      }
    });
    if (existing) {
      return NextResponse.json({ message: "Relation already exists" }, { status: 409 });
    }

    const rel = await prisma.coinNetwork.create({
      data: {
        coin: { connect: { id: coinId } },
        network: { connect: { id: networkId } },
      },
    });

    return NextResponse.json({ message: "Relation created", relation: rel });
  } catch (error) {
    console.error("POST /api/coin-network error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}