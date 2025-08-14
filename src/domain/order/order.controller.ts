import { NextRequest } from "next/server";
import { ok, created, problem } from "@/lib/http";
import { OrderService } from "./order.service";

export class OrderController {
  constructor(private readonly service: OrderService) {}

  list = async () => { try { const r = await this.service.list(); return ok(r.value); } catch (e) { return problem(e); } };

  get = async (_: NextRequest, id: string) => {
    try { const r = await this.service.get(id); return r.ok ? ok(r.value) : problem(r.error); }
    catch (e) { return problem(e); }
  };

  create = async (req: NextRequest) => {
    try { const dto = await req.json(); const r = await this.service.create(dto); return r.ok ? created(r.value) : problem(r.error); }
    catch (e) { return problem(e); }
  };

  update = async (req: NextRequest, id: string) => {
    try { const dto = await req.json(); const r = await this.service.update(id, dto); return r.ok ? ok(r.value) : problem(r.error); }
    catch (e) { return problem(e); }
  };

  deliver = async (_: NextRequest, id: string) => {
    try { const r = await this.service.deliver(id); return r.ok ? ok(r.value) : problem(r.error); }
    catch (e) { return problem(e); }
  };
}
