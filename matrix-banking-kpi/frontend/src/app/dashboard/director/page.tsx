'use client';

import { useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader, KpiCard, LoadingSpinner, ErrorMessage } from '@/components/ui';
import { api, formatNumber } from '@/lib/api';
import { useFetch } from '@/lib/hooks';

const COLORS = ['#f59e0b', '#d97706', '#fbbf24', '#fcd34d', '#b45309'];

export default function DirectorDashboard() {
  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;

  const fetchData = useCallback(
    () => api<{
      bankPerformance: Array<{
        kpiType: string; monthlyTarget: number; monthlyActual: number; monthlyPerformance: number;
      }>;
      districtSummary: Array<{ district_name: string; deposits: number; accounts: number }>;
    }>(`/api/dashboard/director?year=${year}&month=${month}`),
    [year, month]
  );

  const { data, loading, error } = useFetch(fetchData, [year, month]);

  const pieData = data?.districtSummary?.map((d) => ({
    name: d.district_name,
    value: d.deposits,
  })) || [];

  return (
    <DashboardLayout>
      <PageHeader title="Director Dashboard" subtitle="Bank-wide performance overview" />
      {error && <ErrorMessage message={error} />}
      {loading ? <LoadingSpinner /> : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {data?.bankPerformance?.map((kpi) => (
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
              <h3 className="font-bold mb-4">Deposits by District</h3>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatNumber(v, true)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-stone-500 text-center py-8">No district data</p>}
            </div>

            <div className="card overflow-x-auto">
              <h3 className="font-bold mb-4">District Summary</h3>
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="text-left p-3">District</th>
                    <th className="text-right p-3">Accounts</th>
                    <th className="text-right p-3">Deposits</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.districtSummary?.map((d, i) => (
                    <tr key={i} className="border-t border-amber-50">
                      <td className="p-3">{d.district_name}</td>
                      <td className="p-3 text-right">{d.accounts}</td>
                      <td className="p-3 text-right">{formatNumber(d.deposits, true)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
