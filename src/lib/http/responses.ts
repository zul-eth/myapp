export const json = (data: any, init?: number | ResponseInit) =>
  Response.json(data, typeof init === "number" ? { status: init } : init);

export function badRequest(message: string) {
  return json({ error: message }, 400);
}
export function conflict(message: string) {
  return json({ error: message }, 409);
}
export function notFound(message: string) {
  return json({ error: message }, 404);
}
export function serverError(message: string) {
  return json({ error: message }, 500);
}
