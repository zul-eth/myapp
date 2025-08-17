const base = "/api/admin/networks";

async function parseJSON(res: Response) {
  const t = await res.text();
  return t ? JSON.parse(t) : {};
}

export const getNetworks = async () => {
  const res = await fetch(base, { cache: "no-store" });
  return parseJSON(res);
};

export const createNetwork = async (data: any) => {
  const res = await fetch(base, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return parseJSON(res);
};

export const updateNetwork = async (id: string, data: any) => {
  const res = await fetch(`${base}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return parseJSON(res);
};

export const deleteNetwork = async (id: string) => {
  const res = await fetch(`${base}/${id}`, { method: "DELETE" });
  return parseJSON(res);
};

export const toggleNetworkActive = async (id: string, isActive: boolean) => {
  const res = await fetch(`${base}/${id}/active`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isActive }),
  });
  return parseJSON(res);
};

export const getPublicNetworks = async (params: { family?: string; symbol?: string } = {}) => {
  const q = new URLSearchParams();
  if (params.family) q.set("family", params.family);
  if (params.symbol) q.set("symbol", params.symbol);

  const url = `/api/public/networks${q.toString() ? `?${q.toString()}` : ""}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  const t = await res.text();
  return t ? JSON.parse(t) : [];
};
