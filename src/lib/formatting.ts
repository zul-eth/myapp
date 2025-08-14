export const nfmt = (n: number, locale="id-ID") => new Intl.NumberFormat(locale, { maximumFractionDigits: 6 }).format(n);
export const dfmt = (iso?: string | null, locale="id-ID") => iso ? new Date(iso).toLocaleString(locale) : "-";
