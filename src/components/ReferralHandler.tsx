// src/components/ReferralHandler.tsx
"use client";

import { useEffect } from "react";

export default function ReferralHandler() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      localStorage.setItem("memoraah_ref", ref);
    }
  }, []);

  return null; // This component doesn't render anything
}