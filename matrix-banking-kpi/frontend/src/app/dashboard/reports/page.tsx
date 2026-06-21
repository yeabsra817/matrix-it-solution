'use client';

import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import DashboardLayout from '@/components/DashboardLayout';
import { PageHeader, LoadingSpinner, ErrorMessage } from '@/components/ui';
import { api, formatNumber } from '@/lib/api';
import { useFetch } from '@/lib/hooks';

interface ReportEntry {
  entry_date: string;
  full_name: string;
  branch_name: string;
  accounts_opened: number;
  deposit_amount: string;
  mobile_banking_count: number;
  card_banking_count: number;
  qr_banking_count: number;
  status: string;
}

export default function ReportsPage() {
  const year = new Date().getFullYear();
  const [filters, setFilters] = useState({
    startDate: `${year}-01-01`,
    endDate: new Date().toISOString().split('T')[0],
    branchId: '',
    userId: '',
  });

  const fetchReport = useCallback(
    () => api<{ entries: ReportEntry[]; summary: Record<string, number> }>(
      `/api/reports?startDate=${filters.startDate}&endDate=${filters.endDate}${filters.branchId ? `&branchId=${filters.branchId}` : ''}${filters.userId ? `&userId=${filters.userId}` : ''}`
    ),
    [filters]
  );

  const { data, loading, error, refetch } = useFetch(fetchReport, [filters], 60000);

  function exportExcel() {
    if (!data?.entries?.length) return;
    const rows = data.entries.map((e) => ({
      Date: e.entry_date,
      Staff: e.full_name,
      Branch: e.branch_name,
      Accounts: e.accounts_opened,
      Deposits: parseFloat(e.deposit_amount),
      Mobile: e.mobile_banking_count,
      Card: e.card_banking_count,
      QR: e.qr_banking_count,
      Status: e.status,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'KPI Report');
    XLSX.writeFile(wb, `matrix-kpi-report-${filters.startDate}-${filters.endDate}.xlsx`);
  }

  function exportPDF() {
    if (!data?.entries?.length) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Matrix Modern Banking KPI Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Period: ${filters.startDate} to ${filters.endDate}`, 14, 28);
    doc.text('Developed by Yeabsra Teffera – Professional Banker', 14, 34);

    autoTable(doc, {
      startY: 40,
      head: [['Date', 'Staff', 'Branch', 'Accounts', 'Deposits', 'Mobile', 'Status']],
      body: data.entries.map((e) => [
        e.entry_date,
        e.full_name,
        e.branch_name,
        e.accounts_opened,
        formatNumber(parseFloat(e.deposit_amount)),
        e.mobile_banking_count,
        e.status,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [245, 158, 11] },
    });

    doc.save(`matrix-kpi-report-${filters.startDate}.pdf`);
  }

  return (
    <DashboardLayout>
      <PageHeader title="Reports" subtitle="Export KPI data to PDF and Excel" />

      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="label">Start Date</label>
            <input type="date" className="input-field" value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
          </div>
          <div>
            <label className="label">End Date</label>
            <input type="date" className="input-field" value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
          </div>
          <div className="flex items-end gap-2">
            <button onClick={() => refetch()} className="btn-primary">Apply Filters</button>
          </div>
          <div className="flex items-end gap-2">
            <button onClick={exportExcel} className="btn-secondary" disabled={!data?.entries?.length}>Export Excel</button>
            <button onClick={exportPDF} className="btn-secondary" disabled={!data?.entries?.length}>Export PDF</button>
          </div>
        </div>
      </div>

      {data?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Total Accounts', value: data.summary.totalAccounts },
            { label: 'Total Deposits', value: formatNumber(data.summary.totalDeposits, true) },
            { label: 'Mobile Banking', value: data.summary.totalMobile },
            { label: 'Card Banking', value: data.summary.totalCard },
            { label: 'QR Banking', value: data.summary.totalQr },
          ].map((s) => (
            <div key={s.label} className="kpi-card text-center">
              <p className="text-xs opacity-75">{s.label}</p>
              <p className="text-xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {error && <ErrorMessage message={error} />}
      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3">Staff</th>
                <th className="text-left p-3">Branch</th>
                <th className="text-right p-3">Accounts</th>
                <th className="text-right p-3">Deposits</th>
                <th className="text-right p-3">Mobile</th>
                <th className="text-left p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.entries?.map((e, i) => (
                <tr key={i} className="border-t border-amber-50 hover:bg-amber-50">
                  <td className="p-3">{e.entry_date}</td>
                  <td className="p-3">{e.full_name}</td>
                  <td className="p-3">{e.branch_name}</td>
                  <td className="p-3 text-right">{e.accounts_opened}</td>
                  <td className="p-3 text-right">{formatNumber(parseFloat(e.deposit_amount), true)}</td>
                  <td className="p-3 text-right">{e.mobile_banking_count}</td>
                  <td className="p-3">{e.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data?.entries?.length && <p className="text-center py-8 text-stone-500">No approved entries found for this period</p>}
        </div>
      )}
    </DashboardLayout>
  );
}
