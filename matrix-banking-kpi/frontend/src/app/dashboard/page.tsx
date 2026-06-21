'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/lib/useAuth';

export default function DashboardRoot() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="card text-center py-12">
        <h2 className="text-xl font-bold">Welcome, {user?.fullName}</h2>
        <p className="text-stone-500 mt-2">Select a section from the sidebar to get started.</p>
      </div>
    </DashboardLayout>
  );
}
