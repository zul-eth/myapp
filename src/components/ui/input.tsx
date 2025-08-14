"use client";
import * as React from "react";
type Props = React.InputHTMLAttributes<HTMLInputElement>;
export default function Input({ className="", ...rest }: Props){
  return <input className={`border rounded-xl px-3 py-2 text-sm w-full outline-none focus:ring ${className}`} {...rest} />;
}
