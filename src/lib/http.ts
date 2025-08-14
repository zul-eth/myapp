import { NextResponse } from "next/server";
import { ConflictError, DomainError, NotFoundError, ValidationError } from "./errors";

export const ok = <T>(data: T) => NextResponse.json({ data }, { status: 200 });
export const created = <T>(data: T) => NextResponse.json({ data }, { status: 201 });
export const noContent = () => new NextResponse(null, { status: 204 });

export const problem = (e: unknown) => {
  if (e instanceof ValidationError) return NextResponse.json({ error: e.message }, { status: 400 });
  if (e instanceof NotFoundError)   return NextResponse.json({ error: e.message }, { status: 404 });
  if (e instanceof ConflictError)   return NextResponse.json({ error: e.message }, { status: 409 });
  const msg = e instanceof DomainError ? e.message : "Internal server error";
  return NextResponse.json({ error: msg }, { status: 500 });
};