import { getApplicationManager } from "@/core";

export async function GET() {
  const app = getApplicationManager();
  return app.coinNetwork.controller.list();
}
