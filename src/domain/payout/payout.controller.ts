import { NextRequest } from "next/server";
import { json, badRequest } from "@/lib/http/responses";
import { PayoutService } from "./payout.service";

export class PayoutController {
  constructor(private readonly service: PayoutService) {}

  payout = async (_req: NextRequest, params: { id: string }) => {
    if (!params?.id) return badRequest("id wajib");
    const result = await this.service.payoutOrder(params.id);
    return json(result, 200);
  };
}
