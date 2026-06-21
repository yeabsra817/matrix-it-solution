'use client';

import { formatNumber, formatPercent, KPI_LABELS } from '@/lib/api';

interface KpiCardProps {
  title: string;
  target: number;
  actual: number;
  performance: number;
  isCurrency?: boolean;
}

export function KpiCard({ title, target, actual, performance, isCurrency = false }: KpiCardProps) {
  const perfColor = performance >= 100 ? 'text-green-200' : performance >= 70 ? 'text-amber-100' : 'text-red-200';

  return (
    <div className="kpi-card">
      <h3 className="text-sm font-medium opacity-90 mb-3">{title}</h3>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs opacity-75">Target</p>
          <p className="text-lg font-bold">{formatNumber(target, isCurrency)}</p>
        </div>
        <div>
          <p className="text-xs opacity-75">Actual</p>
          <p className="text-lg font-bold">{formatNumber(actual, isCurrency)}</p>
        </div>
        <div>
          <p className="text-xs opacity-75">Achievement</p>
          <p className={`text-lg font-bold ${perfColor}`}>{formatPercent(performance)}</p>
        </div>
      </div>
    </div>
  );
}

interface PerformanceGridProps {
  items: Array<{
    kpiType: string;
    targets: { monthly: number; yearly: number };
    actuals: { monthly: number; yearly: number };
    performance: { monthly: number; yearly: number };
  }>;
}

export function PerformanceGrid({ items }: PerformanceGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <KpiCard
          key={item.kpiType}
          title={KPI_LABELS[item.kpiType] || item.kpiType}
          target={item.targets.monthly}
          actual={item.actuals.monthly}
          performance={item.performance.monthly}
          isCurrency={item.kpiType === 'DEPOSIT_MOBILIZATION'}
        />
      ))}
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
    </div>
  );
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
      {message}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ACTIVE: 'badge-success',
    INACTIVE: 'badge-warning',
    BLOCKED: 'badge-danger',
    PENDING: 'badge-warning',
    APPROVED: 'badge-success',
    REJECTED: 'badge-danger',
  };
  return <span className={`badge ${colors[status] || 'badge-info'}`}>{status}</span>;
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-stone-900">{title}</h1>
      {subtitle && <p className="text-stone-500 mt-1">{subtitle}</p>}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 text-stone-500">
      <p className="text-lg">{message}</p>
    </div>
  );
}
