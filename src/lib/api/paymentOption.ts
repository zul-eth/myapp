// src/lib/api/paymentOption.ts
const base = "/api/admin/payment-options";

async function parseJSON(res: Response) {
  const t = await res.text();
  return t ? JSON.parse(t) : {};
}

/* =========================
 * Admin API helpers
 * ========================= */

export const getPaymentOptions = async () => {
  const res = await fetch(base, { cache: "no-store" });
  return parseJSON(res);
};

export const createPaymentOption = async (data: {
  coinId: string;
  networkId: string;
  isActive?: boolean;
}) => {
  const res = await fetch(base, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return parseJSON(res);
};

/** ⚠️ route admin update pakai PUT (bukan PATCH) */
export const updatePaymentOption = async (
  id: string,
  data: Partial<{ isActive: boolean }>
) => {
  const res = await fetch(`${base}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return parseJSON(res);
};

export const togglePaymentOptionActive = async (id: string, isActive: boolean) => {
  const res = await fetch(`${base}/${id}/active`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isActive }),
  });
  return parseJSON(res);
};

/** ✅ inilah yang hilang dan bikin build error */
export const deletePaymentOption = async (id: string) => {
  const res = await fetch(`${base}/${id}`, { method: "DELETE" });
  return parseJSON(res);
};

/* =========================
 * Public API helpers
 * ========================= */

export type PublicPaymentOptionParams = {
  // pay-side (opsional)
  coinId?: string;
  networkId?: string;
  coinSymbol?: string;
  networkSymbol?: string;
  // buy-side (opsional; pakai kalau mau filter by coin yang dibeli)
  buyCoinId?: string;
  buyNetworkId?: string;
  buyCoinSymbol?: string;
  buyNetworkSymbol?: string;
};

export const getPublicPaymentOptions = async (params: PublicPaymentOptionParams = {}) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).length) q.set(k, String(v));
  });
  const url = `/api/public/payment-options${q.toString() ? `?${q.toString()}` : ""}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  const t = await res.text();
  return t ? JSON.parse(t) : [];
};
