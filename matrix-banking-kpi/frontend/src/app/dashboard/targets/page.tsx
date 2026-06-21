'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader, ErrorMessage } from '@/components/ui';
import { api, KPI_LABELS } from '@/lib/api';

const KPI_TYPES = ['DEPOSIT_MOBILIZATION', 'NEW_ACCOUNTS', 'MOBILE_BANKING', 'CARD_BANKING', 'QR_BANKING'];

export default function TargetsPage() {
  const year = new Date().getFullYear();
  const [targets, setTargets] = useState<Record<string, number>>({
    DEPOSIT_MOBILIZATION: 0,
    NEW_ACCOUNTS: 0,
    MOBILE_BANKING: 0,
    CARD_BANKING: 0,
    QR_BANKING: 0,
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const result = await api('/api/kpi/targets', {
      method: 'POST',
      body: JSON.stringify({
        year,
        targets: KPI_TYPES.map((kpiType) => ({
          kpiType,
          yearlyTarget: targets[kpiType],
        })),
      }),
    });

    setLoading(false);

    if (result.success) {
      setMessage(`Yearly targets set for ${year}. System auto-calculated quarterly, monthly, and daily targets.`);
    } else {
      setError(result.message || 'Something went wrong, please try again');
    }
  }

  return (
    <DashboardLayout>
      <PageHeader title="Set KPI Targets" subtitle={`Define yearly branch targets for ${year}`} />
      {message && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">{message}</div>}
      {error && <ErrorMessage message={error} />}

      <form onSubmit={handleSubmit} className="card max-w-2xl space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 mb-4">
          Targets are automatically broken into Quarterly (÷4), Monthly (÷12), and Daily (÷365) targets.
        </div>

        {KPI_TYPES.map((type) => (
          <div key={type}>
            <label className="label">{KPI_LABELS[type]} – Yearly Target</label>
            <input
              type="number"
              min="0"
              step={type === 'DEPOSIT_MOBILIZATION' ? '0.01' : '1'}
              className="input-field"
              value={targets[type]}
              onChange={(e) => setTargets({ ...targets, [type]: parseFloat(e.target.value) || 0 })}
              required
            />
            {targets[type] > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-stone-500">
                <span>Quarterly: {(targets[type] / 4).toLocaleString()}</span>
                <span>Monthly: {(targets[type] / 12).toLocaleString()}</span>
                <span>Daily: {(targets[type] / 365).toFixed(2)}</span>
              </div>
            )}
          </div>
        ))}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving...' : 'Save Yearly Targets'}
        </button>
      </form>
    </DashboardLayout>
  );
}
