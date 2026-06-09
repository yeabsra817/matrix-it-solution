export type KpiTemplateItem = { name: string; weight: number };

export const KPI_TEMPLATES: Record<string, KpiTemplateItem[]> = {
  TEACHER: [
    { name: "Student Evaluation", weight: 0.2 },
    { name: "Student Performance", weight: 0.2 },
    { name: "Lesson Plan", weight: 0.15 },
    { name: "Timely Grading", weight: 0.15 },
    { name: "Attendance", weight: 0.1 },
    { name: "Assignments", weight: 0.1 },
    { name: "Classroom Management", weight: 0.05 },
    { name: "Discipline", weight: 0.05 },
  ],
  HR: [
    { name: "Staff Management", weight: 0.2 },
    { name: "Recruitment", weight: 0.2 },
    { name: "Performance Monitoring", weight: 0.2 },
    { name: "Leave Management", weight: 0.15 },
    { name: "Training", weight: 0.15 },
    { name: "Staff Support", weight: 0.1 },
  ],
  STAFF: [
    { name: "Task Completion", weight: 0.3 },
    { name: "Reliability", weight: 0.25 },
    { name: "Communication", weight: 0.2 },
    { name: "Documentation", weight: 0.15 },
    { name: "Teamwork", weight: 0.1 },
  ],
  LIBRARIAN: [
    { name: "Catalog Accuracy", weight: 0.25 },
    { name: "Circulation", weight: 0.25 },
    { name: "Student Support", weight: 0.2 },
    { name: "Inventory", weight: 0.15 },
    { name: "Fines Management", weight: 0.15 },
  ],
  ACCOUNTANT: [
    { name: "Financial Accuracy", weight: 0.3 },
    { name: "Budget Control", weight: 0.2 },
    { name: "Reporting", weight: 0.15 },
    { name: "Expense Tracking", weight: 0.15 },
    { name: "Payroll", weight: 0.2 },
  ],
  SECURITY: [
    { name: "Safety", weight: 0.35 },
    { name: "Attendance Control", weight: 0.2 },
    { name: "Incident Reporting", weight: 0.2 },
    { name: "Monitoring", weight: 0.15 },
    { name: "Compliance", weight: 0.1 },
  ],
  CLEANER: [
    { name: "Cleanliness", weight: 0.4 },
    { name: "Hygiene", weight: 0.2 },
    { name: "Timeliness", weight: 0.2 },
    { name: "Waste Management", weight: 0.2 },
  ],
};

export function assertWeightsSumToOne(items: KpiTemplateItem[]): boolean {
  const sum = items.reduce((s, i) => s + i.weight, 0);
  return Math.abs(sum - 1) < 0.001;
}
