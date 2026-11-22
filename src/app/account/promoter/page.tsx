// app/account/promoter/page.tsx
"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { useUser } from "@/context/UserContext";
import { db } from "@/lib/firebase";

interface Promoter {
  referralCode: string;
  totalEarnings?: number;
  pendingEarnings?: number;
}

interface Commission {
  createdAt?: { toDate: () => Date };
  orderId: string;
  amount: number;
  status: string;
}

export default function PromoterPortal() {
  const { user } = useUser();
  const [promoter, setPromoter] = useState<Promoter | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const email = user?.email;
    if (!email) {
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      // Get promoter data
      const promoterQuery = query(
        collection(db, "promoters"),
        where("email", "==", email)
      );
      const promoterSnapshot = await getDocs(promoterQuery);
      
      if (!promoterSnapshot.empty) {
        setPromoter(promoterSnapshot.docs[0].data() as Promoter);
        
        // Get commissions
        const commissionsQuery = query(
          collection(db, "commissions"),
          where("promoterId", "==", promoterSnapshot.docs[0].id),
          orderBy("createdAt", "desc")
        );
        const commissionsSnapshot = await getDocs(commissionsQuery);
        setCommissions(commissionsSnapshot.docs.map(doc => doc.data() as Commission));
      }
      
      setLoading(false);
    };
    
    fetchData();
  }, [user?.email]);

  if (loading) return <div>Loading...</div>;
  if (!promoter) return <div>No promoter account found</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Your Promoter Dashboard</h1>
      
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-2">Your Referral Code</h3>
          <div className="text-2xl font-mono font-bold">{promoter.referralCode}</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-2">Total Earnings</h3>
          <div className="text-2xl font-bold">₹{promoter.totalEarnings?.toFixed(2)}</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-2">Pending Payout</h3>
          <div className="text-2xl font-bold">₹{promoter.pendingEarnings?.toFixed(2)}</div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Your Referral Link</h2>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={`${window.location.origin}/?ref=${promoter.referralCode}`}
            className="flex-1 p-2 border rounded"
          />
          <button 
            onClick={() => navigator.clipboard.writeText(`${window.location.origin}/?ref=${promoter.referralCode}`)}
            className="px-4 bg-blue-600 text-white rounded"
          >
            Copy
          </button>
        </div>
      </div>
      
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Commission History</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="py-2 px-4 text-left">Date</th>
                <th className="py-2 px-4 text-left">Order</th>
                <th className="py-2 px-4 text-right">Amount</th>
                <th className="py-2 px-4 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((commission, i) => (
                <tr key={i} className="border-t">
                  <td className="py-2 px-4">{commission.createdAt?.toDate().toLocaleDateString()}</td>
                  <td className="py-2 px-4">Order #{commission.orderId.substring(0, 8)}</td>
                  <td className="py-2 px-4 text-right">₹{commission.amount.toFixed(2)}</td>
                  <td className="py-2 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      commission.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {commission.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
