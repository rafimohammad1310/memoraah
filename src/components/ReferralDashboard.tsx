// components/ReferralDashboard.tsx
"use client";
import { useUser } from "@/context/UserContext";

export default function ReferralDashboard() {
  const { profile } = useUser();
  const referralLink = `${window.location.origin}/?ref=${profile?.referralCode || ""}`;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Your Referral Program</h2>
      
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <p className="font-medium mb-2">Your Referral Link:</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={referralLink}
            readOnly
            className="flex-1 p-2 border rounded"
          />
          <button 
            onClick={() => navigator.clipboard.writeText(referralLink)}
            className="px-4 bg-blue-600 text-white rounded"
          >
            Copy
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-600">Total Referrals</p>
          <p className="text-2xl font-bold">{profile?.successfulReferrals || 0}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-600">Total Earnings</p>
          <p className="text-2xl font-bold">₹{profile?.referralEarnings?.toFixed(2) || '0.00'}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-purple-600">Pending Verification</p>
          <p className="text-2xl font-bold">{profile?.pendingReferrals || 0}</p>
        </div>
      </div>
    </div>
  );
}
