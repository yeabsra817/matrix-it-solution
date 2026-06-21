'use client';

import { useState, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader, LoadingSpinner, ErrorMessage, StatusBadge } from '@/components/ui';
import { api, ROLE_LABELS } from '@/lib/api';
import { useFetch } from '@/lib/hooks';

interface UserRow {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  branchName?: string;
}

export default function UsersPage() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', fullName: '', role: 'CUSTOMER_SERVICE_OFFICER' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchUsers = useCallback(() => api<UserRow[]>('/api/users'), []);
  const { data: users, loading, error: fetchError, refetch } = useFetch(fetchUsers, []);

  const fetchRoles = useCallback(() => api<string[]>('/api/users/creatable-roles'), []);
  const { data: roles } = useFetch(fetchRoles, []);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const result = await api('/api/users', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    if (result.success) {
      setMessage('User created successfully');
      setShowForm(false);
      setForm({ email: '', fullName: '', role: 'CUSTOMER_SERVICE_OFFICER' });
      refetch();
    } else {
      setError(result.message || 'Something went wrong, please try again');
    }
  }

  async function updateStatus(userId: string, status: string) {
    const result = await api(`/api/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    if (result.success) refetch();
    else alert(result.message);
  }

  return (
    <DashboardLayout>
      <PageHeader title="Staff Management" subtitle="Create, activate, deactivate, and manage staff users" />
      {message && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">{message}</div>}
      {error && <ErrorMessage message={error} />}
      {fetchError && <ErrorMessage message={fetchError} />}

      <div className="mb-4">
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : '+ Create Staff User'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createUser} className="card mb-6 max-w-md space-y-4">
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
              {(roles || ['CUSTOMER_SERVICE_OFFICER']).map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-primary">Create User</button>
        </form>
      )}

      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Role</th>
                <th className="text-left p-3">Branch</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u) => (
                <tr key={u.id} className="border-t border-amber-50 hover:bg-amber-50">
                  <td className="p-3 font-medium">{u.fullName}</td>
                  <td className="p-3 text-sm">{u.email}</td>
                  <td className="p-3 text-sm">{ROLE_LABELS[u.role] || u.role}</td>
                  <td className="p-3 text-sm">{u.branchName || '—'}</td>
                  <td className="p-3"><StatusBadge status={u.status} /></td>
                  <td className="p-3">
                    <div className="flex gap-1 flex-wrap">
                      {u.status !== 'ACTIVE' && (
                        <button onClick={() => updateStatus(u.id, 'ACTIVE')} className="text-xs btn-primary py-1 px-2">Activate</button>
                      )}
                      {u.status === 'ACTIVE' && (
                        <button onClick={() => updateStatus(u.id, 'INACTIVE')} className="text-xs btn-secondary py-1 px-2">Deactivate</button>
                      )}
                      {u.status !== 'BLOCKED' && (
                        <button onClick={() => updateStatus(u.id, 'BLOCKED')} className="text-xs btn-danger py-1 px-2">Block</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
