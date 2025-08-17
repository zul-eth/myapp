const base = "/api/admin/payment-options";

async function parseJSON(res: Response) {
  const t = await res.text();
  return t ? JSON.parse(t) : {};
}

// Admin
export const getPaymentOptions = async () => {
  const res = await fetch(base, { cache: "no-store" });
  return parseJSON(res);
};

export const createPaymentOption = async (data: any) => {
  const res = await fetch(base, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return parseJSON(res);
};

export const updatePaymentOption = async (id: string, data: any) => {
  const res = await fetch(`${base}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return parseJSON(res);
};

export const deletePaymentOption = async (id: string) => {
  const res = await fetch(`${base}/${id}`, { method: "DELETE" });
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

// Public
export type PublicPaymentOptionParams = {
  coinId?: string;
  networkId?: string;
  coinSymbol?: string;
  networkSymbol?: string;
};

export const getPublicPaymentOptions = async (params: PublicPaymentOptionParams = {}) => {
  const q = new URLSearchParams();
  if (params.coinId) q.set("coinId", params.coinId);
  if (params.networkId) q.set("networkId", params.networkId);
  if (params.coinSymbol) q.set("coinSymbol", params.coinSymbol);
  if (params.networkSymbol) q.set("networkSymbol", params.networkSymbol);

  const url = `/api/public/payment-options${q.toString() ? `?${q.toString()}` : ""}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  const t = await res.text();
  return t ? JSON.parse(t) : [];
};
