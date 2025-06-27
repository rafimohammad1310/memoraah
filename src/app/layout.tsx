// src/app/layout.tsx
import { GeistSans, GeistMono } from "geist/font";
import "./globals.css";
import Footer from '@/components/Footer';
import { CartProvider } from "@/context/CartContext";
//import { AuthProvider } from "@/context/AuthContext"; // Optional: if you have a custom auth context
import { SessionProvider } from "next-auth/react";
import { AuthProvider } from '@/context/AuthContext';
export const metadata = {
  title: "My Gift Store",
  description: "Your one-stop store for gifts and collectibles",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <script
          src="https://checkout.razorpay.com/v1/checkout.js"
          type="text/javascript"
          async
        ></script>
      </head>
      <body className="antialiased">
      <AuthProvider>
        <SessionProvider>
          <CartProvider>
            {children}
             <Footer />
          </CartProvider>
        </SessionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}