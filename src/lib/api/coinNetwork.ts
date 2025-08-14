const base = "/api/admin/coin-networks";

async function parseJSON(res: Response) {
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

export const getCoinNetworks = async () => {
  const res = await fetch(base, { cache: "no-store" });
  if (!res.ok) throw new Error((await parseJSON(res)).error || "Gagal mengambil daftar CoinNetwork");
  return parseJSON(res);
};

export const createCoinNetwork = async (data: any) => {
  const res = await fetch(base, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error((await parseJSON(res)).error || "Gagal membuat CoinNetwork");
  return parseJSON(res);
};

export const updateCoinNetwork = async (id: string, data: any) => {
  const res = await fetch(`${base}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error((await parseJSON(res)).error || "Gagal memperbarui CoinNetwork");
  return parseJSON(res);
};

export const deleteCoinNetwork = async (id: string) => {
  const res = await fetch(`${base}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error((await parseJSON(res)).error || "Gagal menghapus CoinNetwork");
  return parseJSON(res);
};

export const getAssetTypes = async () => {
  const res = await fetch(`${base}/asset-types`);
  if (!res.ok) throw new Error((await parseJSON(res)).error || "Gagal mengambil daftar AssetType");
  return parseJSON(res);
};

export const getMemoKinds = async () => {
  const res = await fetch(`${base}/memo-kinds`);
  if (!res.ok) throw new Error((await parseJSON(res)).error || "Gagal mengambil daftar MemoKind");
  return parseJSON(res);
};
