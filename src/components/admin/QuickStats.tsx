// components/admin/QuickStats.tsx
function StatItem({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-white p-4 shadow-sm"><p className="text-sm text-gray-500">{label}</p><p className="mt-1 text-xl font-semibold text-gray-900">{value}</p></div>;
}

export function QuickStats() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <StatItem label="Pending Orders" value="24" />
      <StatItem label="Low Stock Items" value="8" />
      <StatItem label="New Customers" value="15" />
      <StatItem label="Support Tickets" value="3" />
    </div>
  );
}
