// src/app/dashboard/layout.tsx
'use client';

import { DashboardNav } from '@/components/dashboard-nav';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        {/* Top nav - hidden on mobile */}
        <div className="hidden sm:block">
          <DashboardNav />
        </div>

        {/* Mobile header */}
        <div className="sm:hidden bg-white shadow-sm">
          <div className="px-4 py-3">
            <h1 className="text-lg font-bold text-gray-800">Walking Challenge</h1>
          </div>
        </div>

        <main className="py-4 sm:py-10 pb-20 sm:pb-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>

        {/* Bottom nav - mobile only */}
        <MobileBottomNav />
      </div>
    </ProtectedRoute>
  );
}