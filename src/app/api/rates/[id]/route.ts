import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// PUT /api/rates/:id
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const {
      buyCoinId,
      buyNetworkId,
      payCoinId,
      payNetworkId,
      rate,
      updatedBy
    } = body;

    if (!buyCoinId || !buyNetworkId || !payCoinId || !payNetworkId || !rate) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const updated = await prisma.exchangeRate.update({
      where: {
        buyCoinId_buyNetworkId_payCoinId_payNetworkId: {
          buyCoinId,
          buyNetworkId,
          payCoinId,
          payNetworkId
        }
      },
      data: {
        rate,
        updatedBy
      }
    });

    return NextResponse.json({ message: "Rate updated", updatedAt: updated.updatedAt });
  } catch (error) {
    console.error("PUT /api/rates error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const {
      buyCoinId,
      buyNetworkId,
      payCoinId,
      payNetworkId
    } = body;

    if (!buyCoinId || !buyNetworkId || !payCoinId || !payNetworkId) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    await prisma.exchangeRate.delete({
      where: {
        buyCoinId_buyNetworkId_payCoinId_payNetworkId: {
          buyCoinId,
          buyNetworkId,
          payCoinId,
          payNetworkId
        }
      }
    });

    return NextResponse.json({ message: "Rate deleted" });
  } catch (error) {
    console.error("DELETE /api/rates error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}