// components/Footer.tsx
"use client";
import Link from "next/link";
import { useSiteSettings } from "@/lib/useSiteSettings";
import { Instagram, Facebook, Youtube, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  const settings = useSiteSettings();
  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Info */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-pink-500"
              >
                <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14" />
                <path d="M16.5 9.4 7.55 4.24" />
                <polyline points="3.29 7 12 12 20.71 7" />
                <line x1="12" y1="22" x2="12" y2="12" />
                <circle cx="18.5" cy="15.5" r="2.5" />
                <path d="M20.27 17.27 22 19" />
              </svg>
              <span className="font-bold text-xl">{settings.brandName.toUpperCase()}</span>
            </div>
            <p className="text-gray-300 mb-6">
              {settings.footerText}
            </p>
            <div className="flex space-x-4">
              {settings.facebook && <a href={settings.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="text-gray-400 hover:text-pink-500 transition">
                <Facebook className="w-5 h-5" />
              </a>}
              {settings.instagram && <a href={settings.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="text-gray-400 hover:text-pink-500 transition">
                <Instagram className="w-5 h-5" />
              </a>}
              {settings.youtube && <a href={settings.youtube} target="_blank" rel="noreferrer" aria-label="YouTube" className="text-gray-400 hover:text-pink-500 transition">
                <Youtube className="w-5 h-5" />
              </a>}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-pink-500">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/products" className="text-gray-300 hover:text-white transition">
                  Products
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-300 hover:text-white transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-white transition">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-300 hover:text-white transition">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-300 hover:text-white transition">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-pink-500">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <Mail className="w-5 h-5 text-pink-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">{settings.contactEmail}</span>
              </li>
              <li className="flex items-start">
                <Phone className="w-5 h-5 text-pink-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">{settings.contactPhone}</span>
              </li>
              <li className="flex items-start">
                <MapPin className="w-5 h-5 text-pink-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">{settings.contactAddress}</span>
              </li>
            </ul>
          </div>
        </div>

       
        {/* Copyright - Updated with your requested changes */}
        <div className="mt-12 pt-8 border-t border-gray-800 text-center">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} <span className="text-white font-semibold">{settings.brandName}</span>. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
