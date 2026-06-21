'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader, ErrorMessage } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/useAuth';

export default function DailyEntryPage() {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    entryDate: today,
    accountsOpened: 0,
    depositAmount: 0,
    mobileBankingCount: 0,
    cardBankingCount: 0,
    qrBankingCount: 0,
    accountNumbers: '',
    notes: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const accountNumbers = form.accountNumbers
      ? form.accountNumbers.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

    const result = await api('/api/entries', {
      method: 'POST',
      body: JSON.stringify({
        entryDate: form.entryDate,
        accountsOpened: form.accountsOpened,
        depositAmount: form.depositAmount,
        mobileBankingCount: form.mobileBankingCount,
        cardBankingCount: form.cardBankingCount,
        qrBankingCount: form.qrBankingCount,
        accountNumbers,
        notes: form.notes || undefined,
      }),
    });

    setLoading(false);

    if (result.success) {
      setMessage('Daily entry submitted successfully. Awaiting branch manager approval.');
      setForm({ ...form, accountsOpened: 0, depositAmount: 0, mobileBankingCount: 0, cardBankingCount: 0, qrBankingCount: 0, accountNumbers: '', notes: '' });
    } else {
      setError(result.message || 'Something went wrong, please try again');
    }
  }

  return (
    <DashboardLayout>
      <PageHeader title="Daily Performance Entry" subtitle="Submit your daily KPI achievements" />
      {message && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">{message}</div>}
      {error && <ErrorMessage message={error} />}

      <form onSubmit={handleSubmit} className="card max-w-2xl space-y-4">
        <div>
          <label className="label">Entry Date</label>
          <input type="date" className="input-field" value={form.entryDate}
            onChange={(e) => setForm({ ...form, entryDate: e.target.value })} required />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Accounts Opened</label>
            <input type="number" min="0" className="input-field" value={form.accountsOpened}
              onChange={(e) => setForm({ ...form, accountsOpened: parseInt(e.target.value) || 0 })} />
          </div>
          <div>
            <label className="label">Deposit Mobilized (ETB)</label>
            <input type="number" min="0" step="0.01" className="input-field" value={form.depositAmount}
              onChange={(e) => setForm({ ...form, depositAmount: parseFloat(e.target.value) || 0 })} />
          </div>
          <div>
            <label className="label">Mobile Banking Registrations</label>
            <input type="number" min="0" className="input-field" value={form.mobileBankingCount}
              onChange={(e) => setForm({ ...form, mobileBankingCount: parseInt(e.target.value) || 0 })} />
          </div>
          <div>
            <label className="label">Card Banking</label>
            <input type="number" min="0" className="input-field" value={form.cardBankingCount}
              onChange={(e) => setForm({ ...form, cardBankingCount: parseInt(e.target.value) || 0 })} />
          </div>
          <div>
            <label className="label">QR Banking</label>
            <input type="number" min="0" className="input-field" value={form.qrBankingCount}
              onChange={(e) => setForm({ ...form, qrBankingCount: parseInt(e.target.value) || 0 })} />
          </div>
        </div>
        <div>
          <label className="label">Account Numbers (comma-separated, must match accounts opened)</label>
          <input type="text" className="input-field" placeholder="ACC001, ACC002, ACC003"
            value={form.accountNumbers} onChange={(e) => setForm({ ...form, accountNumbers: e.target.value })} />
          <p className="text-xs text-stone-500 mt-1">Prevents duplicate account entries across the bank</p>
        </div>
        <div>
          <label className="label">Notes (optional)</label>
          <textarea className="input-field" rows={3} value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Daily Entry'}
        </button>
      </form>
    </DashboardLayout>
  );
}
