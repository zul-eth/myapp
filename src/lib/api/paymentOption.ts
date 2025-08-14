const base = "/api/admin/payment-options";

async function parseJSON(res: Response) {
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

export const getPaymentOptions = async () => {
  const res = await fetch(base, { cache: "no-store" });
  if (!res.ok) throw new Error((await parseJSON(res)).error || "Gagal mengambil daftar PaymentOption");
  return parseJSON(res);
};

export const createPaymentOption = async (data: { coinId: string; networkId: string }) => {
  const res = await fetch(base, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error((await parseJSON(res)).error || "Gagal membuat PaymentOption");
  return parseJSON(res);
};

export const togglePaymentOptionActive = async (id: string, isActive: boolean) => {
  const res = await fetch(`${base}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isActive })
  });
  if (!res.ok) throw new Error((await parseJSON(res)).error || "Gagal mengubah status PaymentOption");
  return parseJSON(res);
};

export const deletePaymentOption = async (id: string) => {
  const res = await fetch(`${base}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error((await parseJSON(res)).error || "Gagal menghapus PaymentOption");
  return parseJSON(res);
};
