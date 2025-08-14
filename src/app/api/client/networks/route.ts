import { getApplicationManager } from "@/core";

export async function GET() {
  const app = getApplicationManager();
  return app.network.controller.list();
}
