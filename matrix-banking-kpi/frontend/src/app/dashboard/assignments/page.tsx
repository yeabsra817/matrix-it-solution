'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader, LoadingSpinner, ErrorMessage } from '@/components/ui';
import { api, KPI_LABELS } from '@/lib/api';

const KPI_TYPES = ['DEPOSIT_MOBILIZATION', 'NEW_ACCOUNTS', 'MOBILE_BANKING', 'CARD_BANKING', 'QR_BANKING'];

interface StaffUser {
  id: string;
  fullName: string;
  role: string;
}

interface BranchTarget {
  kpi_type: string;
  yearly_target: string;
}

export default function AssignmentsPage() {
  const year = new Date().getFullYear();
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [branchTargets, setBranchTargets] = useState<BranchTarget[]>([]);
  const [allocations, setAllocations] = useState<Record<string, Record<string, number>>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    const [usersRes, targetsRes] = await Promise.all([
      api<Array<{ id: string; full_name: string; role: string }>>('/api/users'),
      api<BranchTarget[]>(`/api/kpi/targets?year=${year}`),
    ]);

    if (usersRes.success && usersRes.data) {
      const staffUsers = usersRes.data
        .filter((u) => !['BRANCH_MANAGER', 'DISTRICT_MANAGER', 'DIRECTOR_DEPOSIT_MOBILIZATION'].includes(u.role))
        .map((u) => ({ id: u.id, fullName: u.full_name, role: u.role }));
      setStaff(staffUsers);
    }
    if (targetsRes.success && targetsRes.data) {
      setBranchTargets(targetsRes.data);
    }
    setLoading(false);
  }, [year]);

  useEffect(() => { loadData(); }, [loadData]);

  function setAllocation(userId: string, kpiType: string, value: number) {
    setAllocations((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], [kpiType]: value },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');

    const assignments: Array<{ userId: string; kpiType: string; yearlyAllocation: number }> = [];
    for (const user of staff) {
      for (const kpiType of KPI_TYPES) {
        const val = allocations[user.id]?.[kpiType] || 0;
        if (val > 0) {
          assignments.push({ userId: user.id, kpiType, yearlyAllocation: val });
        }
      }
    }

    const result = await api('/api/kpi/assignments', {
      method: 'POST',
      body: JSON.stringify({ year, assignments }),
    });

    if (result.success) {
      setMessage('KPI assignments saved. Allocations must equal branch targets per KPI type.');
    } else {
      setError(result.message || 'Something went wrong, please try again');
    }
  }

  function getTotalAllocated(kpiType: string): number {
    return staff.reduce((sum, s) => sum + (allocations[s.id]?.[kpiType] || 0), 0);
  }

  function getBranchTarget(kpiType: string): number {
    const t = branchTargets.find((bt) => bt.kpi_type === kpiType);
    return t ? parseFloat(t.yearly_target) : 0;
  }

  return (
    <DashboardLayout>
      <PageHeader title="Staff KPI Assignments" subtitle="Allocate branch targets to staff members" />
      {message && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">{message}</div>}
      {error && <ErrorMessage message={error} />}

      {loading ? <LoadingSpinner /> : staff.length === 0 ? (
        <div className="card text-center py-8 text-stone-500">No staff members found. Create staff users first.</div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="card overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="text-left p-3 sticky left-0 bg-amber-50">Staff</th>
                  {KPI_TYPES.map((t) => (
                    <th key={t} className="text-center p-3 min-w-[120px]">{KPI_LABELS[t]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.id} className="border-t border-amber-50">
                    <td className="p-3 sticky left-0 bg-white font-medium">{s.fullName}</td>
                    {KPI_TYPES.map((t) => (
                      <td key={t} className="p-2">
                        <input
                          type="number"
                          min="0"
                          className="input-field text-center text-sm py-1.5"
                          value={allocations[s.id]?.[t] || ''}
                          onChange={(e) => setAllocation(s.id, t, parseFloat(e.target.value) || 0)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-t-2 border-amber-300 bg-amber-50 font-semibold">
                  <td className="p-3">Total / Target</td>
                  {KPI_TYPES.map((t) => {
                    const total = getTotalAllocated(t);
                    const target = getBranchTarget(t);
                    const match = Math.abs(total - target) < 0.01;
                    return (
                      <td key={t} className={`p-3 text-center ${match ? 'text-green-700' : 'text-red-600'}`}>
                        {total.toLocaleString()} / {target.toLocaleString()}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
          <button type="submit" className="btn-primary">Save Assignments</button>
        </form>
      )}
    </DashboardLayout>
  );
}
