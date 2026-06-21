'use client';

import { useState, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader, LoadingSpinner, ErrorMessage } from '@/components/ui';
import { api } from '@/lib/api';
import { useFetch } from '@/lib/hooks';

export default function OrganizationPage() {
  const [showDistrictForm, setShowDistrictForm] = useState(false);
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [districtForm, setDistrictForm] = useState({ name: '', code: '' });
  const [branchForm, setBranchForm] = useState({ name: '', code: '', districtId: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchDistricts = useCallback(() => api<Array<{ id: string; name: string; code: string; branch_count: number }>>('/api/organization/districts'), []);
  const fetchBranches = useCallback(() => api<Array<{ id: string; name: string; code: string; district_name: string }>>('/api/organization/branches'), []);

  const { data: districts, loading: dLoading, refetch: refetchD } = useFetch(fetchDistricts, []);
  const { data: branches, loading: bLoading, refetch: refetchB } = useFetch(fetchBranches, []);

  async function createDistrict(e: React.FormEvent) {
    e.preventDefault();
    const result = await api('/api/organization/districts', { method: 'POST', body: JSON.stringify(districtForm) });
    if (result.success) {
      setMessage('District created');
      setShowDistrictForm(false);
      refetchD();
    } else setError(result.message || 'Something went wrong, please try again');
  }

  async function createBranch(e: React.FormEvent) {
    e.preventDefault();
    const result = await api('/api/organization/branches', { method: 'POST', body: JSON.stringify(branchForm) });
    if (result.success) {
      setMessage('Branch created');
      setShowBranchForm(false);
      refetchB();
    } else setError(result.message || 'Something went wrong, please try again');
  }

  return (
    <DashboardLayout>
      <PageHeader title="Organization" subtitle="Manage districts and branches" />
      {message && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">{message}</div>}
      {error && <ErrorMessage message={error} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">Districts</h3>
            <button onClick={() => setShowDistrictForm(!showDistrictForm)} className="btn-primary text-sm py-2">+ Add District</button>
          </div>
          {showDistrictForm && (
            <form onSubmit={createDistrict} className="card mb-4 space-y-3">
              <input className="input-field" placeholder="District Name" value={districtForm.name}
                onChange={(e) => setDistrictForm({ ...districtForm, name: e.target.value })} required />
              <input className="input-field" placeholder="Code" value={districtForm.code}
                onChange={(e) => setDistrictForm({ ...districtForm, code: e.target.value })} required />
              <button type="submit" className="btn-primary text-sm">Create</button>
            </form>
          )}
          {dLoading ? <LoadingSpinner /> : (
            <div className="card space-y-2">
              {districts?.map((d) => (
                <div key={d.id} className="flex justify-between p-3 bg-amber-50 rounded-lg">
                  <div>
                    <p className="font-medium">{d.name}</p>
                    <p className="text-xs text-stone-500">{d.code}</p>
                  </div>
                  <span className="text-sm text-amber-700">{d.branch_count} branches</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">Branches</h3>
            <button onClick={() => setShowBranchForm(!showBranchForm)} className="btn-primary text-sm py-2">+ Add Branch</button>
          </div>
          {showBranchForm && (
            <form onSubmit={createBranch} className="card mb-4 space-y-3">
              <input className="input-field" placeholder="Branch Name" value={branchForm.name}
                onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })} required />
              <input className="input-field" placeholder="Code" value={branchForm.code}
                onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })} required />
              <select className="input-field" value={branchForm.districtId}
                onChange={(e) => setBranchForm({ ...branchForm, districtId: e.target.value })} required>
                <option value="">Select District</option>
                {districts?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <button type="submit" className="btn-primary text-sm">Create</button>
            </form>
          )}
          {bLoading ? <LoadingSpinner /> : (
            <div className="card space-y-2">
              {branches?.map((b) => (
                <div key={b.id} className="flex justify-between p-3 bg-amber-50 rounded-lg">
                  <div>
                    <p className="font-medium">{b.name}</p>
                    <p className="text-xs text-stone-500">{b.code} · {b.district_name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
