'use client';

import { useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader, LoadingSpinner, ErrorMessage, StatusBadge } from '@/components/ui';
import { api, formatNumber } from '@/lib/api';
import { useFetch } from '@/lib/hooks';

interface PendingEntry {
  id: string;
  full_name: string;
  entry_date: string;
  accounts_opened: number;
  deposit_amount: string;
  mobile_banking_count: number;
  card_banking_count: number;
  qr_banking_count: number;
  status: string;
  notes?: string;
}

export default function ApprovalsPage() {
  const fetchPending = useCallback(() => api<PendingEntry[]>('/api/entries/pending'), []);
  const { data: entries, loading, error, refetch } = useFetch(fetchPending, []);

  async function handleApproval(entryId: string, status: 'APPROVED' | 'REJECTED') {
    let rejectionReason: string | undefined;
    if (status === 'REJECTED') {
      rejectionReason = prompt('Enter rejection reason:') || undefined;
      if (!rejectionReason) return;
    }

    const result = await api(`/api/entries/${entryId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ status, rejectionReason }),
    });

    if (result.success) {
      refetch();
    } else {
      alert(result.message || 'Something went wrong, please try again');
    }
  }

  return (
    <DashboardLayout>
      <PageHeader title="Entry Approvals" subtitle="Review and approve daily staff KPI entries" />
      {error && <ErrorMessage message={error} />}
      {loading ? <LoadingSpinner /> : (
        <div className="space-y-4">
          {entries?.length === 0 && (
            <div className="card text-center py-12 text-stone-500">No pending entries to approve</div>
          )}
          {entries?.map((entry) => (
            <div key={entry.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">{entry.full_name}</h3>
                  <p className="text-sm text-stone-500">{entry.entry_date}</p>
                </div>
                <StatusBadge status={entry.status} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 text-sm">
                <div><span className="text-stone-500">Accounts:</span> <strong>{entry.accounts_opened}</strong></div>
                <div><span className="text-stone-500">Deposits:</span> <strong>{formatNumber(parseFloat(entry.deposit_amount), true)}</strong></div>
                <div><span className="text-stone-500">Mobile:</span> <strong>{entry.mobile_banking_count}</strong></div>
                <div><span className="text-stone-500">Card:</span> <strong>{entry.card_banking_count}</strong></div>
                <div><span className="text-stone-500">QR:</span> <strong>{entry.qr_banking_count}</strong></div>
              </div>
              {entry.notes && <p className="text-sm text-stone-600 mb-4">Notes: {entry.notes}</p>}
              <div className="flex gap-3">
                <button onClick={() => handleApproval(entry.id, 'APPROVED')} className="btn-primary text-sm py-2">
                  Approve
                </button>
                <button onClick={() => handleApproval(entry.id, 'REJECTED')} className="btn-danger text-sm py-2">
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
