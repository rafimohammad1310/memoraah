// src/app/layout.tsx
import { GeistSans, GeistMono } from "geist/font";
import "./globals.css";
import Footer from "@/components/Footer";
import Providers from "./providers";
import TrafficTracker from "@/components/TrafficTracker";

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
        <Providers>
          <TrafficTracker />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
