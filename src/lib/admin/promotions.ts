import { Promotion } from "@/types/promotion";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Type definition for Promotion (create this in src/types/promotion.ts)
export type Promotion = {
  id: string;
  code: string;
  discountValue: number;
  type: "percentage" | "fixed";
  startDate: Date;
  endDate: Date;
  usageLimit: number | null;
  usageCount: number;
  status: "active" | "inactive";
  minOrderAmount?: number;
  appliesTo?: string[]; // Product IDs
};

// Fetch promotions from Firestore
export async function getPromotions(): Promise<Promotion[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "promotions"));
    const promotions: Promotion[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      promotions.push({
        id: doc.id,
        code: data.code,
        discountValue: data.discountValue,
        type: data.type,
        startDate: data.startDate.toDate(),
        endDate: data.endDate.toDate(),
        usageLimit: data.usageLimit || null,
        usageCount: data.usageCount || 0,
        status: data.status,
        minOrderAmount: data.minOrderAmount,
        appliesTo: data.appliesTo || []
      });
    });

    return promotions;
  } catch (error) {
    console.error("Error fetching promotions:", error);
    throw error;
  }
}

// Alternative mock data version if not using Firestore
export async function getMockPromotions(): Promise<Promotion[]> {
  return [
    {
      id: "PROMO1",
      code: "SUMMER25",
      discountValue: 25,
      type: "percentage",
      startDate: new Date("2023-06-01"),
      endDate: new Date("2023-08-31"),
      usageLimit: 100,
      usageCount: 42,
      status: "active",
      minOrderAmount: 50
    },
    {
      id: "PROMO2",
      code: "FREESHIP",
      discountValue: 5.99,
      type: "fixed",
      startDate: new Date("2023-05-01"),
      endDate: new Date("2023-12-31"),
      usageLimit: null,
      usageCount: 18,
      status: "active"
    }
  ];
}