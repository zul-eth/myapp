import { getApplicationManager } from "@/core";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const app = getApplicationManager();
  return app.exchangeRate.controller.getLatest(req);
}
