"use client";

export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent">
          <span className="sr-only">Loading...</span>
        </div>
        <p className="mt-4 text-lg">Loading dashboard...</p>
      </div>
    </div>
  );
}