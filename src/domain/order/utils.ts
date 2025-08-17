export function randomTag6(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
export function randomText8(): string {
  const s = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 8; i++) out += s[Math.floor(Math.random() * s.length)];
  return out;
}
export function minutesFromNow(min: number) {
  const d = new Date();
  d.setMinutes(d.getMinutes() + min);
  return d;
}
