import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Intake CRM — Lead & Patient Management',
  description: 'Comprehensive intake CRM for lead tracking, patient management, and workflow automation.',
  openGraph: {
    title: 'Intake CRM — Lead & Patient Management',
    description: 'Comprehensive intake CRM for lead tracking, patient management, and workflow automation.',
    url: 'https://ahs-crm.vercel.app',
    siteName: 'Intake CRM',
    type: 'website',
  },
  robots: {
    index: false, // Internal enterprise tool: prevent public search engine indexing
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
