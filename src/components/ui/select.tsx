"use client";

import * as React from "react";

const s = (x: unknown) => (x == null ? "" : String(x));

type Props = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> & {
  options: { value: string; label: string }[];
  placeholder?: string;
};

export default function Select({
  className = "",
  options,
  placeholder = "Pilih…",
  value,
  defaultValue,
  disabled,
  ...rest
}: Props) {
  const isControlled = value !== undefined;
  const base = {
    className: `border rounded-xl px-3 py-2 text-sm w-full outline-none focus:ring ${
      disabled ? "bg-slate-100 text-slate-400 cursor-not-allowed" : ""
    } ${className}`,
    disabled,
    ...rest,
  } as React.SelectHTMLAttributes<HTMLSelectElement>;

  return (
    <select
      {...base}
      {...(isControlled ? { value: s(value) } : { defaultValue: s(defaultValue) || "" })}
    >
      <option value="" disabled hidden>{placeholder}</option>
      {options.map(o => (
        <option key={o.value} value={o.value}>{s(o.label)}</option>
      ))}
    </select>
  );
}
