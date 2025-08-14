const adminBase = "/api/admin/orders";
const clientBase = "/api/client/orders";

async function parseJSON(res: Response) {
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

/* ---------------- ADMIN ---------------- */
export const adminGetOrders = async (params?: { status?: string; search?: string }) => {
  const query = new URLSearchParams();
  if (params?.status) query.append("status", params.status);
  if (params?.search) query.append("search", params.search);

  const res = await fetch(`${adminBase}?${query.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error((await parseJSON(res)).error || "Gagal mengambil orders");
  return parseJSON(res);
};

export const adminCreateOrder = async (data: any) => {
  const res = await fetch(adminBase, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error((await parseJSON(res)).error || "Gagal membuat order");
  return parseJSON(res);
};

export const adminUpdateOrder = async (id: string, data: any) => {
  const res = await fetch(`${adminBase}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error((await parseJSON(res)).error || "Gagal mengupdate order");
  return parseJSON(res);
};

export const adminDeleteOrder = async (id: string) => {
  const res = await fetch(`${adminBase}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error((await parseJSON(res)).error || "Gagal menghapus order");
  return parseJSON(res);
};

/* ---------------- CLIENT ---------------- */
export const clientCreateOrder = async (data: any) => {
  const res = await fetch(clientBase, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error((await parseJSON(res)).error || "Gagal membuat order");
  return parseJSON(res);
};

export const clientGetOrderDetail = async (id: string) => {
  const res = await fetch(`${clientBase}/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error((await parseJSON(res)).error || "Order tidak ditemukan");
  return parseJSON(res);
};

export const clientGetOrderStatus = async (id: string) => {
  const res = await fetch(`${clientBase}/${id}/status`, { cache: "no-store" });
  if (!res.ok) throw new Error((await parseJSON(res)).error || "Gagal mengambil status order");
  return parseJSON(res);
};

export const clientUpdatePayment = async (id: string, data: any) => {
  const res = await fetch(`${clientBase}/${id}/payment`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error((await parseJSON(res)).error || "Gagal memperbarui pembayaran");
  return parseJSON(res);
};
