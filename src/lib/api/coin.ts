const base = "/api/admin/coins";

async function parseJSON(res: Response) {
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

export const getCoins = async () => {
  const res = await fetch(base);
  return parseJSON(res);
};

export const createCoin = async (data: any) => {
  const res = await fetch(base, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return parseJSON(res);
};

export const updateCoin = async (id: string, data: any) => {
  const res = await fetch(`${base}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return parseJSON(res);
};

export const deleteCoin = async (id: string) => {
  const res = await fetch(`${base}/${id}`, { method: "DELETE" });
  return parseJSON(res);
};

export const toggleCoinActive = async (id: string, isActive: boolean) => {
  const res = await fetch(`${base}/${id}/active`, { // ✅ URL benar
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isActive })
  });
  return parseJSON(res);
};
