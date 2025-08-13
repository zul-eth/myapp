// src/lib/payments/notify.ts
import 'server-only';

type UpdatePayload = {
  webhook_id: string;
  addresses_to_add: string[];
  addresses_to_remove: string[];
};

const BASE = 'https://dashboard.alchemy.com/api';
const ENDPOINT_PATCH = `${BASE}/update-webhook-addresses`;   // PATCH
const ENDPOINT_PUT   = `${BASE}/update-webhook-addresses`;   // PUT (replace)
const TOKEN = process.env.ALCHEMY_NOTIFY_TOKEN || '';

function chunk<T>(arr: T[], size = 100): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function uniqNormalized(addresses: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const a of addresses || []) {
    const raw = (a || '').trim();
    if (!raw) continue;
    const key = raw.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(raw); // kirim bentuk asli (Alchemy terima checksum/lowercase)
  }
  return out;
}

async function callAlchemyPATCH(payload: UpdatePayload): Promise<any> {
  if (!TOKEN) throw new Error('ALCHEMY_NOTIFY_TOKEN kosong');
  const res = await fetch(ENDPOINT_PATCH, {
    method: 'PATCH', // ⬅️ WAJIB PATCH (bukan POST)
    headers: { 'Content-Type': 'application/json', 'X-Alchemy-Token': TOKEN },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let json: any = null; try { json = JSON.parse(text); } catch {}
  if (!res.ok) {
    throw new Error(
      `Alchemy ${res.status}: ${text || 'unknown error'} ` +
      `(webhook_id=${payload.webhook_id}, add=${payload.addresses_to_add.length}, rem=${payload.addresses_to_remove.length})`
    );
  }
  console.log('Alchemy PATCH ok:', {
    webhook_id: payload.webhook_id,
    add: payload.addresses_to_add.length,
    remove: payload.addresses_to_remove.length,
    body: json ?? text,
  });
  return json ?? text;
}

/** Ganti SELURUH daftar alamat di webhook (lebih agresif & pasti sinkron). */
export async function replaceWebhookAddresses(webhookId: string, addresses: string[]) {
  if (!TOKEN) throw new Error('ALCHEMY_NOTIFY_TOKEN kosong');
  const list = uniqNormalized(addresses);
  const res = await fetch(ENDPOINT_PUT, {
    method: 'PUT', // ⬅️ Replace semua alamat
    headers: { 'Content-Type': 'application/json', 'X-Alchemy-Token': TOKEN },
    body: JSON.stringify({ webhook_id: webhookId, addresses: list }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Alchemy ${res.status}: ${text || 'unknown error'} (replace webhook_id=${webhookId}, size=${list.length})`);
  }
  console.log('Alchemy PUT (replace) ok:', { webhook_id: webhookId, size: list.length, body: text });
}

export async function addAddressesToWebhook(webhookId: string, addresses: string[]) {
  if (!webhookId) throw new Error('webhookId kosong');
  const add = uniqNormalized(addresses);
  if (!add.length) return;
  for (const batch of chunk(add, 100)) {
    await callAlchemyPATCH({ webhook_id: webhookId, addresses_to_add: batch, addresses_to_remove: [] });
  }
}

export async function removeAddressesFromWebhook(webhookId: string, addresses: string[]) {
  if (!webhookId) throw new Error('webhookId kosong');
  const rem = uniqNormalized(addresses);
  if (!rem.length) return;
  for (const batch of chunk(rem, 100)) {
    await callAlchemyPATCH({ webhook_id: webhookId, addresses_to_add: [], addresses_to_remove: batch });
  }
}
