import { getApplicationManager } from "@/core";
import { NetworkCreateSchema } from "@/lib/validation/network";
import { badRequest, conflict, json } from "@/lib/http/responses";

export const dynamic = "force-dynamic";

export async function GET() {
  const app = getApplicationManager();
  return json(await app.network.service.listAll());
}

export async function POST(req: Request) {
  const app = getApplicationManager();
  const body = await req.json().catch(() => ({}));
  const parsed = NetworkCreateSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues?.[0]?.message ?? "Input tidak valid");
  try {
    const created = await app.network.service.create(parsed.data);
    return json(created, 201);
  } catch (e: any) {
    const msg = e?.message ?? "Gagal membuat network";
    if (/sudah ada/i.test(msg)) return conflict(msg);
    return badRequest(msg);
  }
}
