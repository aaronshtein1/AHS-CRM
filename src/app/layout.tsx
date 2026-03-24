import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Intake CRM — Lead & Patient Management',
  description: 'Comprehensive intake CRM for lead tracking, patient management, and workflow automation.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
