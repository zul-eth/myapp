"use client";
import * as React from "react";
type Props = React.ButtonHTMLAttributes<HTMLButtonElement>;
export default function Button({ className="", ...rest }: Props){
  return <button className={`px-4 py-2 rounded-2xl shadow text-sm font-medium bg-black text-white hover:opacity-90 disabled:opacity-50 ${className}`} {...rest} />;
}
