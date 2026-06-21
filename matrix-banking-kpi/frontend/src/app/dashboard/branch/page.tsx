'use client';

import { useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader, KpiCard, LoadingSpinner, ErrorMessage, StatusBadge } from '@/components/ui';
import { api, formatNumber } from '@/lib/api';
import { useAuth } from '@/lib/useAuth';
import { useFetch } from '@/lib/hooks';

export default function BranchDashboard() {
  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;

  const fetchData = useCallback(
    () => api<{
      branchPerformance: Array<{
        kpiType: string; monthlyTarget: number; monthlyActual: number; monthlyPerformance: number;
      }>;
      staffPerformance: Array<{ full_name: string; role: string; accounts: number; deposits: number; mobile: number }>;
      pendingApprovals: Array<{ id: string; full_name: string; entry_date: string; status: string }>;
    }>(`/api/dashboard/branch?year=${year}&month=${month}`),
    [year, month]
  );

  const { data, loading, error } = useFetch(fetchData, [year, month]);

  const staffChart = data?.staffPerformance?.map((s) => ({
    name: s.full_name.split(' ')[0],
    accounts: s.accounts,
    deposits: s.deposits / 1000,
  })) || [];

  return (
    <DashboardLayout>
      <PageHeader title="Branch Manager Dashboard" subtitle="Branch performance and staff overview" />
      {error && <ErrorMessage message={error} />}
      {loading ? <LoadingSpinner /> : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {data?.branchPerformance?.map((kpi) => (
              <KpiCard
                key={kpi.kpiType}
                title={kpi.kpiType.replace(/_/g, ' ')}
                target={kpi.monthlyTarget}
                actual={kpi.monthlyActual}
                performance={kpi.monthlyPerformance}
                isCurrency={kpi.kpiType === 'DEPOSIT_MOBILIZATION'}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-bold mb-4">Staff Performance (Monthly)</h3>
              {staffChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={staffChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#fde68a" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="accounts" fill="#f59e0b" name="Accounts" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-stone-500 text-center py-8">No staff data available</p>}
            </div>

            <div className="card">
              <h3 className="font-bold mb-4">Pending Approvals ({data?.pendingApprovals?.length || 0})</h3>
              {data?.pendingApprovals?.length ? (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {data.pendingApprovals.map((p) => (
                    <div key={p.id} className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{p.full_name}</p>
                        <p className="text-xs text-stone-500">{p.entry_date}</p>
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                  ))}
                </div>
              ) : <p className="text-stone-500 text-center py-8">No pending approvals</p>}
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
