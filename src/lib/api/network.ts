const base = "/api/admin/networks";

async function parseJSON(res: Response) {
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

export const getNetworks = async () => {
  const res = await fetch(base, { cache: "no-store" });
  if (!res.ok) throw new Error((await parseJSON(res)).error || "Gagal mengambil daftar network");
  return parseJSON(res);
};

export const createNetwork = async (data: any) => {
  const res = await fetch(base, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error((await parseJSON(res)).error || "Gagal membuat network");
  return parseJSON(res);
};

export const updateNetwork = async (id: string, data: any) => {
  const res = await fetch(`${base}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error((await parseJSON(res)).error || "Gagal memperbarui network");
  return parseJSON(res);
};

export const deleteNetwork = async (id: string) => {
  const res = await fetch(`${base}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error((await parseJSON(res)).error || "Gagal menghapus network");
  return parseJSON(res);
};

export const toggleNetworkActive = async (id: string, isActive: boolean) => {
  const res = await fetch(`${base}/${id}/active`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isActive })
  });
  if (!res.ok) throw new Error((await parseJSON(res)).error || "Gagal mengubah status aktif network");
  return parseJSON(res);
};
