const base = "/api/admin/coin-networks";

async function parseJSON(res: Response) {
  const t = await res.text();
  return t ? JSON.parse(t) : {};
}

export const getCoinNetworks = async () => {
  const res = await fetch(base, { cache: "no-store" });
  return parseJSON(res);
};

export const createCoinNetwork = async (data: any) => {
  const res = await fetch(base, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return parseJSON(res);
};

export const updateCoinNetwork = async (id: string, data: any) => {
  const res = await fetch(`${base}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return parseJSON(res);
};

export const deleteCoinNetwork = async (id: string) => {
  const res = await fetch(`${base}/${id}`, { method: "DELETE" });
  return parseJSON(res);
};

export const toggleCoinNetworkActive = async (id: string, isActive: boolean) => {
  const res = await fetch(`${base}/${id}/active`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isActive }),
  });
  return parseJSON(res);
};
