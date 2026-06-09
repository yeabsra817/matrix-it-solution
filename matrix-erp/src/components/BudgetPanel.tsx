"use client";

import { useEffect, useState } from "react";

type Budget = {
  id: string;
  fiscalYear: string;
  category: string;
  allocated: number;
  spent: number;
  description?: string;
};

export function BudgetPanel() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [summary, setSummary] = useState({ allocated: 0, spent: 0, remaining: 0 });
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/school/budget");
    const d = await res.json();
    setBudgets(d.budgets || []);
    setSummary({
      allocated: d.summary?.allocated || 0,
      spent: d.summary?.spent || 0,
      remaining: d.remaining || 0,
    });
    setEnabled(d.enabled !== false);
  }

  useEffect(() => {
    load();
  }, []);

  async function createBudget(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/school/budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fiscalYear: form.get("fiscalYear"),
        category: form.get("category"),
        allocated: Number(form.get("allocated")),
        description: form.get("description"),
      }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "Failed");
      return;
    }
    e.currentTarget.reset();
    load();
  }

  async function addSpend(budgetId: string, amount: number) {
    const res = await fetch("/api/school/budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ budgetId, amount, note: "Expense entry" }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "Failed");
      return;
    }
    load();
  }

  if (!enabled) {
    return <p className="text-slate-400">Budget module disabled for this school.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-slate-400">Allocated</p>
          <p className="text-2xl font-bold">{summary.allocated.toLocaleString()}</p>
        </div>
        <div className="card">
          <p className="text-slate-400">Spent</p>
          <p className="text-2xl font-bold">{summary.spent.toLocaleString()}</p>
        </div>
        <div className="card">
          <p className="text-slate-400">Remaining</p>
          <p className="text-2xl font-bold text-green-400">
            {summary.remaining.toLocaleString()}
          </p>
        </div>
      </div>

      <form onSubmit={createBudget} className="card grid gap-3 sm:grid-cols-4 items-end">
        <div>
          <label className="label">Fiscal Year</label>
          <input className="input" name="fiscalYear" defaultValue="2025" required />
        </div>
        <div>
          <label className="label">Category</label>
          <input className="input" name="category" placeholder="Salaries" required />
        </div>
        <div>
          <label className="label">Allocated</label>
          <input className="input" name="allocated" type="number" required />
        </div>
        <button className="btn btn-primary" type="submit">
          Add Budget Line
        </button>
        {error && <p className="text-red-300 sm:col-span-4">{error}</p>}
      </form>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Year</th>
              <th>Category</th>
              <th>Allocated</th>
              <th>Spent</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {budgets.map((b) => (
              <tr key={b.id}>
                <td>{b.fiscalYear}</td>
                <td>{b.category}</td>
                <td>{b.allocated.toLocaleString()}</td>
                <td>{b.spent.toLocaleString()}</td>
                <td>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => addSpend(b.id, 1000)}
                  >
                    +1000 Spend
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
