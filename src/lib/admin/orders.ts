import { Order } from "@/types/order";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Type definition for Order (create this in src/types/order.ts)
export type Order = {
  id: string;
  customer: {
    name: string;
    email: string;
  };
  date: Date;
  amount: number;
  status: "pending" | "completed" | "cancelled";
  items: {
    productId: string;
    quantity: number;
    price: number;
  }[];
};

// Fetch orders from Firestore
export async function getOrders(): Promise<Order[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "orders"));
    const orders: Order[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      orders.push({
        id: doc.id,
        customer: data.customer,
        date: data.date.toDate(),
        amount: data.amount,
        status: data.status,
        items: data.items,
      });
    });

    return orders;
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
}

// Alternative mock data version if not using Firestore
export async function getMockOrders(): Promise<Order[]> {
  return [
    {
      id: "ORD-001",
      customer: {
        name: "John Doe",
        email: "john@example.com"
      },
      date: new Date("2023-05-15"),
      amount: 125.99,
      status: "completed",
      items: [
        { productId: "PROD-1", quantity: 2, price: 50 },
        { productId: "PROD-2", quantity: 1, price: 25.99 }
      ]
    },
    {
      id: "ORD-002",
      customer: {
        name: "Jane Smith",
        email: "jane@example.com"
      },
      date: new Date("2023-05-16"),
      amount: 89.50,
      status: "pending",
      items: [
        { productId: "PROD-3", quantity: 3, price: 29.83 }
      ]
    }
  ];
}