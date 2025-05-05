// src/components/admin/Icons.tsx
"use client";

import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  Package,
  ShoppingBag,
  FileText,
  Settings,
  Percent,
  Activity,
  Truck,
  CreditCard
} from "lucide-react";

export const Icons = {
  revenue: DollarSign,
  orders: ShoppingCart,
  users: Users,
  trending: TrendingUp,
  products: Package,
  promotions: Percent,
  reports: FileText,
  settings: Settings,
  traffic: Activity,
  delivery: Truck,
  payments: CreditCard
};

export type IconName = keyof typeof Icons;