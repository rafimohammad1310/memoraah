"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
export default function TrafficTracker(){const pathname=usePathname();useEffect(()=>{if(!pathname||pathname.startsWith("/admin"))return;let source="direct";try{const ref=document.referrer?new URL(document.referrer):null;source=ref?(ref.hostname===location.hostname?"direct":ref.hostname.replace(/^www\./,"")):(new URLSearchParams(location.search).get("utm_source")||"direct");}catch{}void fetch("/api/traffic",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:pathname,source})}).catch(()=>{});},[pathname]);return null}
