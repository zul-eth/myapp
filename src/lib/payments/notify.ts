type UpdatePayload = {
  webhook_id: string;
  addresses_to_add: string[];
  addresses_to_remove: string[];
};

const ENDPOINT = 'https://dashboard.alchemy.com/api/update-webhook-addresses';

function chunk<T>(arr: T[], size = 100): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function normalize(addresses: string[]) {
  return [...new Set((addresses || []).map(a => (a || '').toLowerCase()).filter(Boolean))];
}

async function callAlchemy(payload: UpdatePayload, retries = 2) {
  const token = process.env.ALCHEMY_NOTIFY_TOKEN;
  if (!token) throw new Error('ALCHEMY_NOTIFY_TOKEN missing (Auth Token dari halaman Webhooks)');

  const res = await fetch(ENDPOINT, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-Alchemy-Token': token,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    if ((res.status === 429 || res.status >= 500) && retries > 0) {
      await new Promise(r => setTimeout(r, 700 * (3 - retries)));
      return callAlchemy(payload, retries - 1);
    }
    throw new Error(`Alchemy ${res.status}: ${await res.text()}`);
  }
  try { return await res.json(); } catch { return await res.text(); }
}

export async function addAddressesToWebhook(webhookId: string, addresses: string[]) {
  if (!webhookId) throw new Error('webhookId is empty');
  const add = normalize(addresses);
  if (!add.length) return;
  for (const batch of chunk(add, 100)) {
    await callAlchemy({ webhook_id: webhookId, addresses_to_add: batch, addresses_to_remove: [] });
  }
}

export async function removeAddressesFromWebhook(webhookId: string, addresses: string[]) {
  if (!webhookId) throw new Error('webhookId is empty');
  const rem = normalize(addresses);
  if (!rem.length) return;
  for (const batch of chunk(rem, 100)) {
    await callAlchemy({ webhook_id: webhookId, addresses_to_add: [], addresses_to_remove: batch });
  }
}
