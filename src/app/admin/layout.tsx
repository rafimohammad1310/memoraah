"use client";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import Sidebar from "@/components/admin/Sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      setLoading(true);
      if (!user) {
        setAuthenticated(false);
        if (window.location.pathname !== "/admin") router.replace("/admin");
        setLoading(false);
        return;
      }
      try {
        const token = await user.getIdTokenResult(true);
        const isAdmin = token.claims.admin === true;
        if (!active) return;
        setAuthenticated(isAdmin);
        if (!isAdmin) {
          router.replace("/admin");
        }
      } catch {
        if (!active) return;
        setAuthenticated(false);
        router.replace("/admin");
      } finally {
        if (active) setLoading(false);
      }
    });

    return () => { active = false; unsubscribe(); };
  }, [router]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // The root admin route is the login page; all other routes stay blank until authorized.
  if (!authenticated && pathname === "/admin") {
    return <>{children}</>;
  }
  if (!authenticated) return null;

  // Show layout with sidebar for authenticated users
  return (
    <div className="flex min-h-screen flex-col bg-[#f7f5fb] md:flex-row">
      <Sidebar />
      <div className="min-w-0 flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        {children}
      </div>
    </div>
  );
}
