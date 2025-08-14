"use client";
import { useEffect, useState } from "react";
import { getLatestRate } from "@/server/actions/rates.actions";
import { nfmt, dfmt } from "@/lib/formatting";

export default function LatestRateWidget({ pair }:{ pair:{ buyCoinId:string; buyNetworkId:string; payCoinId:string; payNetworkId:string } }){
  const [data,setData]=useState<any>(null);
  useEffect(()=>{ let mounted=true; (async()=>{ try{ const r=await getLatestRate(pair); if(mounted) setData(r); }catch{ setData(null);} })(); return ()=>{mounted=false}; },[pair]);
  if(!data) return <div className="text-sm">Loading rate…</div>;
  return (
    <div className="rounded-2xl border p-4 shadow-sm">
      <div className="text-xs text-slate-500">Latest {data.buyCoinId}/{data.payCoinId}</div>
      <div className="text-2xl font-semibold">{nfmt(data.rate)}</div>
      <div className="text-xs text-slate-400 mt-1">as of {dfmt(data.asOf)}</div>
    </div>
  );
}
