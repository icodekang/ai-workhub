import type { Metadata } from 'next';
import { AppShell } from '@/components/Layout';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'AI-WorkHub',
  description: 'AI-Powered WorkHub Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
