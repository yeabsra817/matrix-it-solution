import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Matrix Modern Banking KPI Tracker',
  description: 'Professional Banking KPI Management System by Yeabsra Teffera',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
