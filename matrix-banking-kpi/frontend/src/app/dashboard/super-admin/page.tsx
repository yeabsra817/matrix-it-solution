'use client';

import { useState, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader, LoadingSpinner, ErrorMessage, StatusBadge } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/useAuth';
import { useFetch } from '@/lib/hooks';

interface Bank {
  id: string;
  name: string;
  bankCode: string;
  isActive: boolean;
  userCount: number;
  createdAt: string;
}

export default function SuperAdminPage() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [bankName, setBankName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchBanks = useCallback(() => api<Bank[]>('/api/banks'), []);
  const { data: banks, loading, error: fetchError, refetch } = useFetch(fetchBanks, []);

  async function createBank(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    const result = await api<{ bankCode: string; message: string }>('/api/banks', {
      method: 'POST',
      body: JSON.stringify({ name: bankName }),
    });
    if (result.success && result.data) {
      setMessage(result.data.message);
      setBankName('');
      setShowForm(false);
      refetch();
    } else {
      setError(result.message || 'Something went wrong, please try again');
    }
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Bank Management"
        subtitle="Create and manage banks. Performance data is not accessible from this role."
      />

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-sm text-amber-800">
        <strong>Security Notice:</strong> As Super Admin, you can create banks and top-level users but cannot view bank performance data.
      </div>

      {message && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">{message}</div>}
      {error && <ErrorMessage message={error} />}
      {fetchError && <ErrorMessage message={fetchError} />}

      <div className="mb-6">
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : '+ Create New Bank'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createBank} className="card mb-6 max-w-md">
          <div>
            <label className="label">Bank Name</label>
            <input className="input-field" value={bankName} onChange={(e) => setBankName(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary mt-4">Create Bank</button>
        </form>
      )}

      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="text-left p-3">Bank Name</th>
                <th className="text-left p-3">Bank Code</th>
                <th className="text-left p-3">Users</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {banks?.map((bank) => (
                <tr key={bank.id} className="border-t border-amber-50 hover:bg-amber-50">
                  <td className="p-3 font-medium">{bank.name}</td>
                  <td className="p-3 font-mono text-amber-700">{bank.bankCode}</td>
                  <td className="p-3">{bank.userCount}</td>
                  <td className="p-3"><StatusBadge status={bank.isActive ? 'ACTIVE' : 'INACTIVE'} /></td>
                  <td className="p-3 text-sm text-stone-500">{new Date(bank.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
