"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

const menuItems = [
  { name: "Dashboard", path: "/admin/dashboard" },
  { name: "Products", path: "/admin/products" },
  { name: "Orders", path: "/admin/orders" },
  { name: "Customers", path: "/admin/customers" },
  { name: "Promotions", path: "/admin/promotions" },
  { name: "Reports", path: "/admin/reports" },
  { name: "Settings", path: "/admin/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Force a full page reload to reset all states
      window.location.href = "/admin";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <aside className="w-full shrink-0 border-b border-[#eee8f7] bg-white shadow-sm md:w-64 md:border-b-0 md:border-r">
      <div className="border-b border-[#eee8f7] p-4">
        <h1 className="text-xl font-bold text-[#553987]">Admin Panel</h1>
      </div>
      <nav className="p-3 md:p-4">
        <ul className="flex gap-2 overflow-x-auto md:flex-col md:space-y-2 md:gap-0">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                href={item.path}
                className={`block whitespace-nowrap rounded-md px-4 py-2 text-sm ${
                  pathname === item.path
                    ? "bg-[#f0eafa] font-semibold text-[#6946a3]"
                    : "text-gray-700 hover:bg-[#faf8fd]"
                }`}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="border-t border-[#eee8f7] p-3 md:p-4">
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 rounded-md"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
