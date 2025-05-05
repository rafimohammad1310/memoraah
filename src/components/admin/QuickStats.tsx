// components/admin/QuickStats.tsx
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