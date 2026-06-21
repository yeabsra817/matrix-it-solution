'use client';

import { useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader, LoadingSpinner, ErrorMessage } from '@/components/ui';
import { api, formatNumber } from '@/lib/api';
import { useFetch } from '@/lib/hooks';

export default function DistrictDashboard() {
  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;

  const fetchData = useCallback(
    () => api<{ branches: Array<{ name: string; accounts: number; deposits: number; mobile: number }> }>(
      `/api/dashboard/district?year=${year}&month=${month}`
    ),
    [year, month]
  );

  const { data, loading, error } = useFetch(fetchData, [year, month]);

  const chartData = data?.branches?.map((b) => ({
    name: b.name.replace(' Branch', ''),
    accounts: b.accounts,
    deposits: b.deposits / 1000,
    mobile: b.mobile,
  })) || [];

  return (
    <DashboardLayout>
      <PageHeader title="District Manager Dashboard" subtitle="Branch performance comparison" />
      {error && <ErrorMessage message={error} />}
      {loading ? <LoadingSpinner /> : (
        <>
          <div className="card mb-6">
            <h3 className="font-bold mb-4">Branch Comparison (Monthly)</h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fde68a" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number, name: string) => [name === 'deposits' ? formatNumber(v * 1000, true) : v, name]} />
                  <Bar dataKey="accounts" fill="#f59e0b" name="Accounts" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="deposits" fill="#d97706" name="Deposits (K)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="mobile" fill="#fbbf24" name="Mobile" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-stone-500 text-center py-8">No branch data available</p>}
          </div>

          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="text-left p-3">Branch</th>
                  <th className="text-right p-3">Accounts</th>
                  <th className="text-right p-3">Deposits</th>
                  <th className="text-right p-3">Mobile Banking</th>
                </tr>
              </thead>
              <tbody>
                {data?.branches?.map((b, i) => (
                  <tr key={i} className="border-t border-amber-50 hover:bg-amber-50">
                    <td className="p-3 font-medium">{b.name}</td>
                    <td className="p-3 text-right">{b.accounts}</td>
                    <td className="p-3 text-right">{formatNumber(b.deposits, true)}</td>
                    <td className="p-3 text-right">{b.mobile}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
