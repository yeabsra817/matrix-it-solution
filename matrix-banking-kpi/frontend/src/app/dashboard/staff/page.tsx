'use client';

import { useState, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader, PerformanceGrid, LoadingSpinner, ErrorMessage } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/useAuth';
import { useFetch } from '@/lib/hooks';

export default function StaffDashboard() {
  const { user } = useAuth();
  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;

  const fetchData = useCallback(
    () => api<{ performance: Parameters<typeof PerformanceGrid>[0]['items']; trend: Array<Record<string, unknown>> }>(
      `/api/dashboard/staff?year=${year}&month=${month}`
    ),
    [year, month]
  );

  const { data, loading, error } = useFetch(fetchData, [year, month]);

  const trendData = data?.trend?.map((t) => ({
    date: String(t.entry_date).slice(5),
    accounts: Number(t.accounts),
    deposits: Number(t.deposits) / 1000,
  })) || [];

  return (
    <DashboardLayout>
      <PageHeader title="My KPI Dashboard" subtitle={`${user?.fullName} – Personal performance overview`} />
      {error && <ErrorMessage message={error} />}
      {loading ? <LoadingSpinner /> : (
        <>
          {data?.performance && <PerformanceGrid items={data.performance} />}
          <div className="card mt-6">
            <h3 className="font-bold text-lg mb-4">Daily Trend (Last 30 Days)</h3>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fde68a" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="accounts" stroke="#f59e0b" strokeWidth={2} name="Accounts" />
                  <Line type="monotone" dataKey="deposits" stroke="#d97706" strokeWidth={2} name="Deposits (K)" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-stone-500 text-center py-8">No approved entries yet. Submit daily entries to see trends.</p>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
