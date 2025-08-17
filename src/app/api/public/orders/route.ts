import { getApplicationManager } from "@/core";
import { OrderCreateFlexibleSchema } from "@/lib/validation/order";
import { badRequest, json } from "@/lib/http/responses";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const app = getApplicationManager();
  const body = await req.json().catch(() => ({}));

  const parsed = OrderCreateFlexibleSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues?.[0]?.message ?? "Input tidak valid";
    return badRequest(msg);
  }

  try {
    const svc: any = app.order?.service;
    // kompatibel: jika createFlexible ada → pakai, jika tidak → fallback ke create (dipakai di test mock)
    const order =
      typeof svc?.createFlexible === "function"
        ? await svc.createFlexible(parsed.data)
        : await svc.create(parsed.data);

    return json(order, 201);
  } catch (e: any) {
    return badRequest(e?.message ?? "Gagal membuat order");
  }
}
