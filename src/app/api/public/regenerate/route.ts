import { getApplicationManager } from "@/core";
import { badRequest, json } from "@/lib/http/responses";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = getApplicationManager();
  try {
    const out = await app.order.service.regenerateInvoice(id);
    return json(out, 200);
  } catch (e: any) {
    return badRequest(e?.message ?? "Gagal regenerate invoice");
  }
}
