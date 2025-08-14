const base = "/api/admin/exchange-rates";

async function parseJSON(res: Response) {
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

export const getExchangeRates = async () => {
  const res = await fetch(base, { cache: "no-store" });
  if (!res.ok) throw new Error((await parseJSON(res)).error || "Gagal mengambil ExchangeRate");
  return parseJSON(res);
};

export const createExchangeRate = async (data: any) => {
  const res = await fetch(base, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error((await parseJSON(res)).error || "Gagal membuat ExchangeRate");
  return parseJSON(res);
};

export const updateExchangeRate = async (id: string, data: any) => {
  const res = await fetch(`${base}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error((await parseJSON(res)).error || "Gagal memperbarui ExchangeRate");
  return parseJSON(res);
};

export const deleteExchangeRate = async (id: string) => {
  const res = await fetch(`${base}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error((await parseJSON(res)).error || "Gagal menghapus ExchangeRate");
  return parseJSON(res);
};
