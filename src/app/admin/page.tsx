"use client";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import AdminLoginForm from "@/components/admin/AdminLoginForm";

export default function AdminLoginPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const token = await user.getIdTokenResult(true);
          if (token.claims.admin === true) { router.replace("/admin/dashboard"); return; }
        } catch { /* Keep the login form available if token refresh fails. */ }
      }
      setChecking(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (checking) return <div className="flex min-h-screen items-center justify-center">Checking administrator access…</div>;
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#faf7ff] via-white to-[#f2ebfc] p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#eee8f7] bg-white p-6 shadow-xl shadow-[#553987]/10 sm:p-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#7654b5]">Memoraah</p>
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Admin Login</h1>
        <AdminLoginForm />
      </div>
    </div>
  );
}
