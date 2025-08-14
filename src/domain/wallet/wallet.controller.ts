import { NextRequest } from "next/server";
import { ok, problem } from "@/lib/http";
import { WalletService } from "./wallet.service";

export class WalletController {
  constructor(private readonly service: WalletService) {}
  derive = async (req: NextRequest) => { try { const { chain } = await req.json(); const r = await this.service.derive(chain); return ok(r.value);} catch(e){ return problem(e);} };
  payout = async (req: NextRequest) => { try { const dto = await req.json(); const r = await this.service.payout(dto); return ok(r.value);} catch(e){ return problem(e);} };
}
