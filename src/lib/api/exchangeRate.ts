const base = "/api/admin/exchange-rates";

async function parseJSON(res: Response) {
  const t = await res.text();
  return t ? JSON.parse(t) : {};
}

export const getExchangeRates = async () => {
  const res = await fetch(base, { cache: "no-store" });
  return parseJSON(res);
};

export const createExchangeRate = async (data: any) => {
  const res = await fetch(base, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return parseJSON(res);
};

export const updateExchangeRate = async (id: string, data: any) => {
  const res = await fetch(`${base}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return parseJSON(res);
};

export const deleteExchangeRate = async (id: string) => {
  const res = await fetch(`${base}/${id}`, { method: "DELETE" });
  return parseJSON(res);
};

export const getPublicExchangeRates = async (params: {
  buyCoinId?: string;
  buyNetworkId?: string;
  payCoinId?: string;
  payNetworkId?: string;
  buyCoinSymbol?: string;
  buyNetworkSymbol?: string;
  payCoinSymbol?: string;
  payNetworkSymbol?: string;
} = {}) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) q.set(k, String(v));
  });
  const url = `/api/public/exchange-rates${q.toString() ? `?${q.toString()}` : ""}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  const t = await res.text();
  return t ? JSON.parse(t) : [];
};

