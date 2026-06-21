'use client';

import { useState, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader, LoadingSpinner, ErrorMessage } from '@/components/ui';
import { api, ROLE_LABELS } from '@/lib/api';
import { useFetch } from '@/lib/hooks';

interface Bank {
  id: string;
  name: string;
  bankCode: string;
}

export default function SuperAdminUsersPage() {
  const [selectedBank, setSelectedBank] = useState('');
  const [form, setForm] = useState({
    email: '',
    fullName: '',
    role: 'DIRECTOR_DEPOSIT_MOBILIZATION' as string,
    districtId: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchBanks = useCallback(() => api<Bank[]>('/api/banks'), []);
  const { data: banks, loading } = useFetch(fetchBanks, []);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBank) {
      setError('Please select a bank');
      return;
    }
    setError('');
    const result = await api(`/api/banks/${selectedBank}/users`, {
      method: 'POST',
      body: JSON.stringify({
        email: form.email,
        fullName: form.fullName,
        role: form.role,
        districtId: form.role === 'DISTRICT_MANAGER' ? form.districtId : undefined,
      }),
    });
    if (result.success) {
      setMessage('User created successfully');
      setForm({ email: '', fullName: '', role: 'DIRECTOR_DEPOSIT_MOBILIZATION', districtId: '' });
    } else {
      setError(result.message || 'Something went wrong, please try again');
    }
  }

  return (
    <DashboardLayout>
      <PageHeader title="Create Bank Users" subtitle="Create District Managers and Directors for banks" />
      {message && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">{message}</div>}
      {error && <ErrorMessage message={error} />}

      {loading ? <LoadingSpinner /> : (
        <form onSubmit={createUser} className="card max-w-md space-y-4">
          <div>
            <label className="label">Select Bank</label>
            <select className="input-field" value={selectedBank} onChange={(e) => setSelectedBank(e.target.value)} required>
              <option value="">Choose a bank...</option>
              {banks?.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.bankCode})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Full Name</label>
            <input className="input-field" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input-field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="DIRECTOR_DEPOSIT_MOBILIZATION">{ROLE_LABELS.DIRECTOR_DEPOSIT_MOBILIZATION}</option>
              <option value="DISTRICT_MANAGER">{ROLE_LABELS.DISTRICT_MANAGER}</option>
            </select>
          </div>
          {form.role === 'DISTRICT_MANAGER' && (
            <div>
              <label className="label">District ID (UUID from database)</label>
              <input className="input-field" value={form.districtId} onChange={(e) => setForm({ ...form, districtId: e.target.value })} placeholder="Required for District Manager" />
            </div>
          )}
          <button type="submit" className="btn-primary">Create User</button>
        </form>
      )}
    </DashboardLayout>
  );
}
