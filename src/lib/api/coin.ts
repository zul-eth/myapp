const base = "/api/admin/coins";

type CoinDTO = {
  id: string;
  symbol: string;
  name: string;
  logoUrl?: string | null;
  isActive: boolean;
  createdAt: string;
};

async function parseJSON(res: Response) {
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

export const getCoins = async (): Promise<CoinDTO[]> => {
  const res = await fetch(base, { cache: "no-store" });
  return parseJSON(res);
};

export const createCoin = async (data: { symbol: string; name: string; logoUrl?: string | null }) => {
  const res = await fetch(base, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return parseJSON(res);
};

export const updateCoin = async (id: string, data: Partial<{ symbol: string; name: string; logoUrl?: string | null; isActive: boolean }>) => {
  const res = await fetch(`${base}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return parseJSON(res);
};

export const deleteCoin = async (id: string) => {
  const res = await fetch(`${base}/${id}`, { method: "DELETE" });
  return parseJSON(res);
};

export const toggleCoinActive = async (id: string, isActive: boolean) => {
  const res = await fetch(`${base}/${id}/active`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isActive }),
  });
  return parseJSON(res);
};

export const getPublicCoins = async () => {
  const res = await fetch("/api/public/coins", { next: { revalidate: 60 } });
  const text = await res.text();
  return text ? JSON.parse(text) : [];
};

