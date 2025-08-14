"use client";
export function Table({ children }: { children: React.ReactNode }) { return <table className="min-w-[720px] w-full text-sm">{children}</table>; }
export function THead({ children }: { children: React.ReactNode }) { return <thead className="bg-slate-50">{children}</thead>; }
export function TBody({ children }: { children: React.ReactNode }) { return <tbody>{children}</tbody>; }
export function TR({ children }: { children: React.ReactNode }) { return <tr className="[&>th]:px-3 [&>th]:py-2 [&>td]:px-3 [&>td]:py-2 border-t">{children}</tr>; }
export function TH({ children }: { children: React.ReactNode }) { return <th className="text-left">{children}</th>; }
export function TD({ children }: { children: React.ReactNode }) { return <td>{children}</td>; }
